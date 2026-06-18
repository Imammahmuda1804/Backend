import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { TopicScope } from './topic.types';

@Injectable()
export class TopicQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(scope?: TopicScope, destinationId?: number) {
    if (scope === 'detail') return this.findGroups();

    const selectedDestination = destinationId
      ? await this.prisma.destination.findUnique({
          where: { id: destinationId },
          select: { id: true, name: true, slug: true, city: true },
        })
      : null;

    const where = {
      ...(scope === 'search' ? { isSearchVisible: true } : {}),
      ...(destinationId
        ? { destinationTopics: { some: { destinationId } } }
        : {}),
    };

    const topics = await this.prisma.topic.findMany({
      where,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        topicName: true,
        keywords: true,
        labelType: true,
        isSearchVisible: true,
        isDetailVisible: true,
        groupId: true,
        group: { select: { id: true, groupName: true } },
        destinationTopics: destinationId
          ? {
              where: { destinationId },
              select: {
                totalReviews: true,
              },
              take: 1,
            }
          : false,
        _count: { select: { destinationTopics: true } },
      },
    });

    return topics.map((topic) => ({
      id: topic.id,
      topic_name: topic.topicName,
      keywords: topic.keywords,
      label_type: topic.labelType,
      is_search_visible: topic.isSearchVisible,
      is_detail_visible: topic.isDetailVisible,
      group_id: topic.groupId,
      group_name: topic.group?.groupName ?? null,
      group: topic.group
        ? { id: topic.group.id, group_name: topic.group.groupName }
        : null,
      total_destinations: topic._count.destinationTopics,
      selected_destination: selectedDestination,
      selected_destination_reviews:
        topic.destinationTopics?.[0]?.totalReviews ?? null,
    }));
  }

  async findGroups() {
    const groups = await this.prisma.topicGroup.findMany({
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        groupName: true,
        description: true,
        keywords: true,
        displayOrder: true,
        topics: {
          where: { isDetailVisible: true },
          select: {
            id: true,
            topicName: true,
            keywords: true,
            isSearchVisible: true,
            isDetailVisible: true,
            _count: { select: { destinationTopics: true } },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    return groups.map((group) => ({
      id: group.id,
      group_name: group.groupName,
      description: group.description,
      keywords: group.keywords,
      display_order: group.displayOrder,
      topics: group.topics.map((topic) => ({
        id: topic.id,
        topic_name: topic.topicName,
        keywords: topic.keywords,
        is_search_visible: topic.isSearchVisible,
        is_detail_visible: topic.isDetailVisible,
        total_destinations: topic._count.destinationTopics,
      })),
    }));
  }

  async findDestinationsByTopic(topicId: number, page: number, limit: number) {
    await this.ensureTopicExists(topicId);
    const skip = (page - 1) * limit;
    const where = { topicId, destination: { deletedAt: null } };

    const [destinationTopics, total] = await Promise.all([
      this.prisma.destinationTopic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { totalReviews: 'desc' },
        select: {
          totalReviews: true,
          destination: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              province: true,
              thumbnailUrl: true,
              positiveRatio: true,
              recommendationScore: true,
            },
          },
        },
      }),
      this.prisma.destinationTopic.count({ where }),
    ]);

    const data = destinationTopics.map((item) => ({
      ...item.destination,
      total_reviews_in_topic: item.totalReviews,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  private async ensureTopicExists(topicId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });

    if (!topic) throw new NotFoundException('Topic tidak ditemukan');
  }
}
