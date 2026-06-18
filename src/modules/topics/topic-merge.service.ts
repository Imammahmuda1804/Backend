import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewTopicPersistenceService } from '../topic-mapping/review-topic-persistence.service';
import { TopicModelMappingService } from '../topic-mapping/topic-model-mapping.service';
import { normalizeTopicNameForMatch } from './topic-name.util';

@Injectable()
export class TopicMergeService {
  private readonly logger = new Logger(TopicMergeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly topicMapping: TopicModelMappingService,
    private readonly reviewTopicPersistence: ReviewTopicPersistenceService,
  ) {}

  async findTopicByNormalizedName(topicName: string, excludeId?: number) {
    const normalizedName = normalizeTopicNameForMatch(topicName);
    const candidates = await this.prisma.topic.findMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      select: { id: true, topicName: true },
    });

    return (
      candidates.find(
        (topic) =>
          normalizeTopicNameForMatch(topic.topicName) === normalizedName,
      ) ?? null
    );
  }

  async mergeTopics(targetTopicId: number, sourceTopicIds: number[]) {
    const uniqueSourceIds = [...new Set(sourceTopicIds)].filter(
      (id) => id !== targetTopicId,
    );
    if (uniqueSourceIds.length === 0) {
      throw new BadRequestException(
        'Pilih minimal satu topic sumber yang berbeda dari target',
      );
    }

    const topics = await this.prisma.topic.findMany({
      where: { id: { in: [targetTopicId, ...uniqueSourceIds] } },
      select: { id: true, topicName: true, keywords: true },
    });
    const target = topics.find((topic) => topic.id === targetTopicId);
    if (!target) throw new NotFoundException('Topic target tidak ditemukan');

    const sourceTopics = this.getExistingSourceTopics(
      topics,
      targetTopicId,
      uniqueSourceIds,
    );
    const mergedKeywords = this.mergeTopicKeywords(
      target.keywords,
      sourceTopics.map((topic) => topic.keywords),
    );

    await this.prisma.$transaction(async (transaction) => {
      await this.topicMapping.moveMappings(
        transaction,
        targetTopicId,
        uniqueSourceIds,
      );
      await this.moveDestinationRelations(
        transaction,
        targetTopicId,
        uniqueSourceIds,
      );
      await this.reviewTopicPersistence.moveAssignments(
        transaction,
        targetTopicId,
        uniqueSourceIds,
      );
      await transaction.review.updateMany({
        where: { topicId: { in: uniqueSourceIds } },
        data: { topicId: targetTopicId },
      });
      await transaction.topic.update({
        where: { id: targetTopicId },
        data: { keywords: mergedKeywords },
      });
      await transaction.topic.deleteMany({
        where: { id: { in: uniqueSourceIds } },
      });
    });

    this.logger.log(
      `Merged topics [${uniqueSourceIds.join(', ')}] into ${targetTopicId}`,
    );

    return {
      merged: true,
      target_topic_id: targetTopicId,
      target_topic_name: target.topicName,
      source_topic_ids: uniqueSourceIds,
      deleted_topics: uniqueSourceIds.length,
    };
  }

  private async moveDestinationRelations(
    transaction: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    targetTopicId: number,
    sourceTopicIds: number[],
  ) {
    const sourceRelations = await transaction.destinationTopic.findMany({
      where: { topicId: { in: sourceTopicIds } },
    });

    for (const sourceRelation of sourceRelations) {
      const targetRelation = await transaction.destinationTopic.findUnique({
        where: {
          destinationId_topicId: {
            destinationId: sourceRelation.destinationId,
            topicId: targetTopicId,
          },
        },
      });

      if (targetRelation) {
        await transaction.destinationTopic.update({
          where: { id: targetRelation.id },
          data: { totalReviews: { increment: sourceRelation.totalReviews } },
        });
        await transaction.destinationTopic.delete({
          where: { id: sourceRelation.id },
        });
        continue;
      }

      await transaction.destinationTopic.update({
        where: { id: sourceRelation.id },
        data: { topicId: targetTopicId },
      });
    }
  }

  private getExistingSourceTopics(
    topics: Array<{ id: number; keywords: unknown }>,
    targetTopicId: number,
    sourceTopicIds: number[],
  ) {
    const sourceTopics = topics.filter((topic) => topic.id !== targetTopicId);
    const existingIds = new Set(sourceTopics.map((topic) => topic.id));
    const missingIds = sourceTopicIds.filter((id) => !existingIds.has(id));

    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Topic sumber tidak ditemukan: ${missingIds.join(', ')}`,
      );
    }

    return sourceTopics;
  }

  private mergeTopicKeywords(
    targetKeywords: unknown,
    sourceKeywordLists: unknown[],
  ) {
    const keywords = [
      ...this.toKeywordList(targetKeywords),
      ...sourceKeywordLists.flatMap((value) => this.toKeywordList(value)),
    ];

    return keywords
      .filter((keyword, index) => {
        const normalized = normalizeTopicNameForMatch(keyword);
        return (
          keywords.findIndex(
            (item) => normalizeTopicNameForMatch(item) === normalized,
          ) === index
        );
      })
      .slice(0, 20);
  }

  private toKeywordList(value: unknown) {
    if (!Array.isArray(value)) return [];
    return value.map((keyword) => String(keyword).trim()).filter(Boolean);
  }
}
