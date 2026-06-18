import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TopicModelMappingService } from '../topic-mapping/topic-model-mapping.service';
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
  modelTopicId: number;
  modelVersion: string;
  canonicalTopicId: number | null;
  topicName: string;
  keywords: string[];
  existingKeywords: unknown;
  groupId: number | null;
  hasExistingGroup: boolean;
};

type ExistingPipelineTopic = {
  id: number;
  topicName: string | null;
  keywords: unknown;
  groupId: number | null;
} | null;

@Injectable()
export class NlpTopicStorageService {
  private readonly logger = new Logger(NlpTopicStorageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiNamingService: AiNamingService,
    private readonly topicMapping: TopicModelMappingService,
  ) {}

  // Membuat atau memperbarui topik dari hasil pipeline.
  async saveTopics(nlpResult: NlpPipelineResult): Promise<Map<number, number>> {
    const savedTopicIds = new Map<number, number>();
    const groupCandidates = await this.loadTopicGroupCandidates();
    const modelIdentity = this.topicMapping.normalizeModelVersion(
      nlpResult.metadata?.topic_model_version,
      nlpResult.metadata?.topic_trained_at,
    );

    if (!Array.isArray(nlpResult.topics)) return savedTopicIds;

    for (const topic of nlpResult.topics) {
      const savedMapping = await this.savePipelineTopic(
        topic,
        groupCandidates,
        modelIdentity,
      );
      if (savedMapping) {
        savedTopicIds.set(savedMapping.sourceId, savedMapping.targetId);
      }
    }

    return savedTopicIds;
  }

  private async savePipelineTopic(
    topic: PipelineTopic,
    groupCandidates: TopicGroupCandidate[],
    modelVersion: string,
  ) {
    const draft = await this.preparePipelineTopic(
      topic,
      groupCandidates,
      modelVersion,
    );
    if (!draft) return null;

    const targetId = await this.saveResolvedTopic(draft);
    await this.topicMapping.saveMapping(
      draft.modelVersion,
      draft.modelTopicId,
      targetId,
    );

    return { sourceId: draft.modelTopicId, targetId };
  }

  private async preparePipelineTopic(
    topic: PipelineTopic,
    groupCandidates: TopicGroupCandidate[],
    modelVersion: string,
  ): Promise<PipelineTopicDraft | null> {
    const modelTopicId = this.getValidPipelineTopicId(topic);
    if (modelTopicId === null) return null;

    const keywords = this.getPipelineTopicKeywords(topic);
    const representativeDocs = this.getPipelineRepresentativeDocs(topic);
    const canonicalTopicId = await this.topicMapping.resolveCanonicalTopicId(
      modelVersion,
      modelTopicId,
    );
    const existingTopic =
      canonicalTopicId === null
        ? null
        : await this.loadPipelineTopic(canonicalTopicId);

    return this.buildPipelineTopicDraft({
      modelTopicId,
      modelVersion,
      canonicalTopicId,
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
      select: { id: true, topicName: true, keywords: true, groupId: true },
    });
  }

  private async buildPipelineTopicDraft(input: {
    modelTopicId: number;
    modelVersion: string;
    canonicalTopicId: number | null;
    keywords: string[];
    representativeDocs: string[];
    existingTopic: ExistingPipelineTopic;
    groupCandidates: TopicGroupCandidate[];
  }): Promise<PipelineTopicDraft> {
    const topicName = await this.resolveTopicName(
      input.modelTopicId,
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
      modelTopicId: input.modelTopicId,
      modelVersion: input.modelVersion,
      canonicalTopicId: input.canonicalTopicId,
      topicName,
      keywords: input.keywords,
      existingKeywords: input.existingTopic?.keywords,
      groupId,
      hasExistingGroup: this.hasExistingTopicGroup(input.existingTopic),
    };
  }

  private hasExistingTopicGroup(topic: ExistingPipelineTopic) {
    return Boolean(topic?.groupId);
  }

  private async saveResolvedTopic(draft: PipelineTopicDraft) {
    if (draft.canonicalTopicId !== null) {
      await this.updateCanonicalTopic(draft.canonicalTopicId, draft);
      return draft.canonicalTopicId;
    }

    const duplicateTopic = await this.findTopicByNormalizedName(
      draft.topicName,
    );
    if (duplicateTopic) {
      await this.mergeDuplicateTopic(
        draft.modelTopicId,
        draft.topicName,
        duplicateTopic,
        {
          keywords: draft.keywords,
          groupId: draft.groupId,
        },
      );
      return duplicateTopic.id;
    }

    const createdTopic = await this.prisma.topic.create({
      data: {
        topicName: draft.topicName,
        keywords: draft.keywords,
        groupId: draft.groupId,
      },
      select: { id: true },
    });
    return createdTopic.id;
  }

  private async updateCanonicalTopic(
    topicId: number,
    draft: PipelineTopicDraft,
  ) {
    await this.prisma.topic.update({
      where: { id: topicId },
      data: {
        keywords: this.mergeTopicKeywords(
          draft.existingKeywords,
          draft.keywords,
        ),
        ...(draft.hasExistingGroup ? {} : { groupId: draft.groupId }),
      },
    });
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

  private async findTopicByNormalizedName(topicName: string) {
    const normalized = normalizeTopicNameForMatch(topicName);
    const candidates = await this.prisma.topic.findMany({
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
