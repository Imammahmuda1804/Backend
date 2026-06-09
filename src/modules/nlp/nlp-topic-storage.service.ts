import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeTopicNameForMatch } from '../topics/topics.service';
import { AiNamingService } from './ai-naming.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';

type PipelineTopic = NlpPipelineResult['topics'][number];

type TopicGroupCandidate = {
  id: number;
  groupName: string;
  keywords: string[];
};

type PipelineTopicDraft = {
  topicId: number;
  topicName: string;
  keywords: string[];
  groupId: number | null;
  hasExistingGroup: boolean;
};

type ExistingPipelineTopic = {
  id: number;
  topicName: string | null;
  groupId: number | null;
} | null;

@Injectable()
export class NlpTopicStorageService {
  private readonly logger = new Logger(NlpTopicStorageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiNamingService: AiNamingService,
  ) {}
  // Membuat atau memperbarui topik dari hasil pipeline.
  async saveTopics(nlpResult: NlpPipelineResult): Promise<Map<number, number>> {
    const savedTopicIds = new Map<number, number>();
    const groupCandidates = await this.loadTopicGroupCandidates();

    if (!Array.isArray(nlpResult.topics)) return savedTopicIds;

    for (const topic of nlpResult.topics) {
      const topicMapping = await this.savePipelineTopic(topic, groupCandidates);
      if (topicMapping) {
        savedTopicIds.set(topicMapping.sourceId, topicMapping.targetId);
      }
    }

    return savedTopicIds;
  }

  private async savePipelineTopic(
    topic: PipelineTopic,
    groupCandidates: TopicGroupCandidate[],
  ) {
    const draft = await this.preparePipelineTopic(topic, groupCandidates);
    if (!draft) return null;

    const targetId = await this.saveResolvedTopic(
      draft.topicId,
      draft.topicName,
      {
        keywords: draft.keywords,
        groupId: draft.groupId,
        hasExistingGroup: draft.hasExistingGroup,
      },
    );

    return { sourceId: draft.topicId, targetId };
  }

  private async preparePipelineTopic(
    topic: PipelineTopic,
    groupCandidates: TopicGroupCandidate[],
  ): Promise<PipelineTopicDraft | null> {
    const topicId = this.getValidPipelineTopicId(topic);
    if (topicId === null) return null;

    const keywords = this.getPipelineTopicKeywords(topic);
    const representativeDocs = this.getPipelineRepresentativeDocs(topic);
    const existingTopic = await this.loadPipelineTopic(topicId);

    return this.buildPipelineTopicDraft({
      topicId,
      keywords,
      representativeDocs,
      existingTopic,
      groupCandidates,
    });
  }

  private getValidPipelineTopicId(topic: PipelineTopic) {
    const topicId = this.getPipelineTopicId(topic);
    if (topicId === null) this.warnMissingPipelineTopicId(topic);
    return topicId;
  }

  private warnMissingPipelineTopicId(topic: PipelineTopic) {
    this.logger.warn(
      `Skipping topic with no topic_id: ${JSON.stringify(topic)}`,
    );
  }

  private getPipelineTopicKeywords(topic: PipelineTopic) {
    return Array.isArray(topic.keywords) ? topic.keywords : [];
  }

  private getPipelineRepresentativeDocs(topic: PipelineTopic) {
    return topic.representative_docs ?? [];
  }

  private loadPipelineTopic(topicId: number): Promise<ExistingPipelineTopic> {
    return this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, topicName: true, groupId: true },
    });
  }

  private async buildPipelineTopicDraft(input: {
    topicId: number;
    keywords: string[];
    representativeDocs: string[];
    existingTopic: ExistingPipelineTopic;
    groupCandidates: TopicGroupCandidate[];
  }): Promise<PipelineTopicDraft> {
    const topicName = await this.resolveTopicName(
      input.topicId,
      input.keywords,
      input.representativeDocs,
      input.existingTopic?.topicName,
      Boolean(input.existingTopic),
    );
    const groupId = this.resolveTopicGroupId(
      topicName,
      input.keywords,
      input.representativeDocs,
      input.groupCandidates,
      input.existingTopic?.groupId,
    );

    return {
      topicId: input.topicId,
      topicName,
      keywords: input.keywords,
      groupId,
      hasExistingGroup: this.hasExistingTopicGroup(input.existingTopic),
    };
  }

  private hasExistingTopicGroup(topic: ExistingPipelineTopic) {
    return Boolean(topic?.groupId);
  }

  private async saveResolvedTopic(
    topicId: number,
    topicName: string,
    options: {
      keywords: string[];
      groupId: number | null;
      hasExistingGroup: boolean;
    },
  ) {
    const duplicateTopic = await this.findTopicByNormalizedName(
      topicName,
      topicId,
    );
    if (duplicateTopic) {
      await this.mergeDuplicateTopic(topicId, topicName, duplicateTopic, {
        keywords: options.keywords,
        groupId: options.groupId,
      });
      return duplicateTopic.id;
    }

    await this.upsertPipelineTopic(
      topicId,
      topicName,
      options.keywords,
      options.groupId,
      { hasExistingGroup: options.hasExistingGroup },
    );
    return topicId;
  }

  private async loadTopicGroupCandidates(): Promise<TopicGroupCandidate[]> {
    const topicGroups = await this.prisma.topicGroup.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true, groupName: true, keywords: true },
    });

    return topicGroups.map((group) => ({
      id: group.id,
      groupName: group.groupName,
      keywords: Array.isArray(group.keywords)
        ? (group.keywords as string[])
        : [],
    }));
  }

  private getPipelineTopicId(topic: PipelineTopic) {
    return topic.topic_id || topic.topic_id === 0 ? topic.topic_id : null;
  }

  private async resolveTopicName(
    topicId: number,
    keywords: string[],
    representativeDocs: string[],
    existingName?: string | null,
    hasExistingTopic = false,
  ) {
    if (existingName) return existingName;
    if (hasExistingTopic) {
      return `Topic ${topicId}: ${keywords.slice(0, 3).join(', ')}`;
    }

    this.logger.log(`Generating AI name for new topic ${topicId}`);
    return this.aiNamingService.generateTopicName(
      topicId,
      keywords,
      representativeDocs,
    );
  }

  private resolveTopicGroupId(
    topicName: string,
    keywords: string[],
    representativeDocs: string[],
    groupCandidates: TopicGroupCandidate[],
    existingGroupId?: number | null,
  ) {
    return (
      existingGroupId ??
      this.aiNamingService.classifyTopicGroup(
        topicName,
        keywords,
        representativeDocs,
        groupCandidates,
      )
    );
  }

  private async mergeDuplicateTopic(
    topicId: number,
    topicName: string,
    duplicateTopic: {
      id: number;
      keywords: unknown;
      groupId: number | null;
    },
    update: { keywords: string[]; groupId: number | null },
  ) {
    this.logger.log(
      `Topic ${topicId} named "${topicName}" matches existing topic ${duplicateTopic.id}. Mapping reviews to existing topic.`,
    );
    await this.prisma.topic.update({
      where: { id: duplicateTopic.id },
      data: {
        keywords: this.mergeTopicKeywords(
          duplicateTopic.keywords,
          update.keywords,
        ),
        ...(duplicateTopic.groupId ? {} : { groupId: update.groupId }),
      },
    });
  }

  private async upsertPipelineTopic(
    topicId: number,
    topicName: string,
    keywords: string[],
    groupId: number | null,
    options: { hasExistingGroup: boolean },
  ) {
    await this.prisma.topic.upsert({
      where: { id: topicId },
      create: {
        id: topicId,
        topicName,
        keywords,
        groupId,
      },
      update: {
        keywords,
        ...(options.hasExistingGroup ? {} : { groupId }),
      },
    });
  }

  private async findTopicByNormalizedName(
    topicName: string,
    excludeId: number,
  ) {
    const normalized = normalizeTopicNameForMatch(topicName);
    const candidates = await this.prisma.topic.findMany({
      where: { id: { not: excludeId } },
      select: { id: true, topicName: true, keywords: true, groupId: true },
    });
    return (
      candidates.find(
        (topic) => normalizeTopicNameForMatch(topic.topicName) === normalized,
      ) ?? null
    );
  }

  private mergeTopicKeywords(existingKeywords: unknown, newKeywords: string[]) {
    const merged: string[] = [];
    const addKeyword = (keyword: unknown) => {
      const value = String(keyword).trim();
      if (
        value &&
        !merged.some(
          (item) =>
            normalizeTopicNameForMatch(item) ===
            normalizeTopicNameForMatch(value),
        )
      ) {
        merged.push(value);
      }
    };

    if (Array.isArray(existingKeywords)) {
      existingKeywords.forEach(addKeyword);
    }
    newKeywords.forEach(addKeyword);
    return merged.slice(0, 20);
  }
}
