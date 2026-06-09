import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiNamingService } from '../nlp/ai-naming.service';
import { TopicMergeService } from './topic-merge.service';
import type { TopicForAiRename } from './topic.types';

type RenameTopicResult = 'renamed' | 'failed';

@Injectable()
export class TopicManagementService {
  private readonly logger = new Logger(TopicManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiNamingService: AiNamingService,
    private readonly topicMergeService: TopicMergeService,
  ) {}

  async renameUnnamedTopics() {
    const topics = await this.findFallbackNamedTopics();
    const summary = { renamed: 0, failed: 0 };

    this.logger.log(`Found ${topics.length} topics to rename with AI`);
    for (const topic of topics) {
      const result = await this.renameOneFallbackTopic(topic);
      summary[result]++;
    }

    this.logger.log(
      `Rename complete: ${summary.renamed} renamed, ${summary.failed} failed, ${topics.length} total`,
    );
    return { ...summary, total: topics.length };
  }

  async renameTopic(topicId: number, newName: string) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic tidak ditemukan');

    const duplicate = await this.topicMergeService.findTopicByNormalizedName(
      newName,
      topicId,
    );
    if (duplicate) {
      return this.topicMergeService.mergeTopics(duplicate.id, [topicId]);
    }

    const updated = await this.prisma.topic.update({
      where: { id: topicId },
      data: { topicName: newName },
      select: { id: true, topicName: true },
    });
    this.logger.log(`Topic ${topicId} renamed to "${newName}"`);
    return updated;
  }

  async updateTopicSettings(
    topicId: number,
    data: {
      groupId?: number | null;
      isSearchVisible?: boolean;
      isDetailVisible?: boolean;
    },
  ) {
    await this.ensureTopicExists(topicId);
    if (data.groupId) await this.ensureGroupExists(data.groupId);

    const updated = await this.prisma.topic.update({
      where: { id: topicId },
      data: this.buildTopicSettingsUpdate(data),
      select: {
        id: true,
        topicName: true,
        groupId: true,
        isSearchVisible: true,
        isDetailVisible: true,
      },
    });

    return {
      id: updated.id,
      topic_name: updated.topicName,
      group_id: updated.groupId,
      is_search_visible: updated.isSearchVisible,
      is_detail_visible: updated.isDetailVisible,
    };
  }

  private buildTopicSettingsUpdate(data: {
    groupId?: number | null;
    isSearchVisible?: boolean;
    isDetailVisible?: boolean;
  }) {
    return {
      ...(data.groupId !== undefined ? { groupId: data.groupId } : {}),
      ...(data.isSearchVisible !== undefined
        ? { isSearchVisible: data.isSearchVisible }
        : {}),
      ...(data.isDetailVisible !== undefined
        ? { isDetailVisible: data.isDetailVisible }
        : {}),
    };
  }

  async deleteTopic(topicId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic tidak ditemukan');

    await this.prisma.$transaction([
      this.prisma.destinationTopic.deleteMany({ where: { topicId } }),
      this.prisma.review.updateMany({
        where: { topicId },
        data: { topicId: null },
      }),
      this.prisma.topic.delete({ where: { id: topicId } }),
    ]);

    this.logger.log(`Topic ${topicId} ("${topic.topicName}") deleted`);
    return { deleted: true, id: topicId };
  }

  private findFallbackNamedTopics(): Promise<TopicForAiRename[]> {
    return this.prisma.topic.findMany({
      where: { topicName: { startsWith: 'Topic ' } },
      select: { id: true, topicName: true, keywords: true },
    });
  }

  private async renameOneFallbackTopic(
    topic: TopicForAiRename,
  ): Promise<RenameTopicResult> {
    const keywords = this.toKeywordList(topic.keywords);
    if (keywords.length === 0) return 'failed';

    const newName = await this.aiNamingService.generateTopicName(
      topic.id,
      keywords,
    );
    if (newName.startsWith('Topic ')) return 'failed';

    await this.applyGeneratedTopicName(topic, newName);
    return 'renamed';
  }

  private toKeywordList(value: unknown) {
    return Array.isArray(value) ? (value as string[]) : [];
  }

  private async applyGeneratedTopicName(
    topic: TopicForAiRename,
    newName: string,
  ) {
    const duplicate = await this.topicMergeService.findTopicByNormalizedName(
      newName,
      topic.id,
    );
    if (duplicate) {
      await this.topicMergeService.mergeTopics(duplicate.id, [topic.id]);
      this.logger.log(
        `Merged topic ${topic.id}: "${topic.topicName}" -> existing "${duplicate.topicName}"`,
      );
      return;
    }

    await this.prisma.topic.update({
      where: { id: topic.id },
      data: { topicName: newName },
    });
    this.logger.log(
      `Renamed topic ${topic.id}: "${topic.topicName}" -> "${newName}"`,
    );
  }

  private async ensureTopicExists(topicId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });
    if (!topic) throw new NotFoundException('Topic tidak ditemukan');
  }

  private async ensureGroupExists(groupId: number) {
    const group = await this.prisma.topicGroup.findUnique({
      where: { id: groupId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Topic group tidak ditemukan');
  }
}
