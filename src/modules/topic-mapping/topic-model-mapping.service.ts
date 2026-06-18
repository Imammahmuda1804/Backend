import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export const UNVERSIONED_TOPIC_MODEL = 'unversioned';
const MODEL_IDENTITY_SEPARATOR = '@';

type TopicMappingClient = Pick<Prisma.TransactionClient, 'topicModelMapping'>;

/**
 * Menjembatani topic_id milik model dengan topik kanonis yang dikelola admin.
 */
@Injectable()
export class TopicModelMappingService {
  constructor(private readonly prisma: PrismaService) {}

  normalizeModelVersion(
    modelVersion?: string | null,
    trainedAt?: string | null,
  ) {
    const version = modelVersion?.trim() || UNVERSIONED_TOPIC_MODEL;
    const trainingTimestamp = trainedAt?.trim();

    return trainingTimestamp
      ? `${version}${MODEL_IDENTITY_SEPARATOR}${trainingTimestamp}`
      : version;
  }

  async resolveCanonicalTopicId(
    modelVersion: string,
    modelTopicId: number,
  ): Promise<number | null> {
    const mapping = await this.prisma.topicModelMapping.findUnique({
      where: {
        modelVersion_modelTopicId: {
          modelVersion: this.normalizeModelVersion(modelVersion),
          modelTopicId,
        },
      },
      select: { topicId: true },
    });

    return mapping?.topicId ?? null;
  }

  async saveMapping(
    modelVersion: string,
    modelTopicId: number,
    topicId: number,
    client: TopicMappingClient = this.prisma,
  ) {
    return client.topicModelMapping.upsert({
      where: {
        modelVersion_modelTopicId: {
          modelVersion: this.normalizeModelVersion(modelVersion),
          modelTopicId,
        },
      },
      create: {
        modelVersion: this.normalizeModelVersion(modelVersion),
        modelTopicId,
        topicId,
      },
      update: { topicId },
    });
  }

  async moveMappings(
    client: TopicMappingClient,
    targetTopicId: number,
    sourceTopicIds: number[],
  ) {
    if (sourceTopicIds.length === 0) return;

    await client.topicModelMapping.updateMany({
      where: { topicId: { in: sourceTopicIds } },
      data: { topicId: targetTopicId },
    });
  }
}
