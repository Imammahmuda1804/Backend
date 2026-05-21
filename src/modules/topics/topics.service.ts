import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiNamingService } from '../nlp/ai-naming.service';

type TopicScope = 'search' | 'detail';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiNamingService: AiNamingService,
  ) {}

  /**
   * POST /admin/topics/rename-ai
   * Me-rename semua topik yang masih menggunakan nama keyword-based
   * (format "Topic X: ...") menjadi nama informatif via Gemini AI.
   * Bisa dijalankan kapan saja saat quota Gemini tersedia.
   */
  async renameUnnamedTopics(): Promise<{
    renamed: number;
    failed: number;
    total: number;
  }> {
    // Cari topik yang masih pakai nama keyword-based (dimulai dengan "Topic ")
    const topics = await this.prisma.topic.findMany({
      where: {
        topicName: { startsWith: 'Topic ' },
      },
      select: { id: true, topicName: true, keywords: true },
    });

    this.logger.log(`Found ${topics.length} topics to rename with AI`);

    let renamed = 0;
    let failed = 0;

    for (const topic of topics) {
      const keywords = Array.isArray(topic.keywords)
        ? (topic.keywords as string[])
        : [];

      if (keywords.length === 0) {
        failed++;
        continue;
      }

      const newName = await this.aiNamingService.generateTopicName(
        topic.id,
        keywords,
      );

      // Cek apakah AI berhasil memberikan nama baru (bukan fallback keyword-based)
      if (!newName.startsWith('Topic ')) {
        await this.prisma.topic.update({
          where: { id: topic.id },
          data: { topicName: newName },
        });
        this.logger.log(
          `Renamed topic ${topic.id}: "${topic.topicName}" → "${newName}"`,
        );
        renamed++;
      } else {
        failed++;
      }
    }

    this.logger.log(
      `Rename complete: ${renamed} renamed, ${failed} failed, ${topics.length} total`,
    );
    return { renamed, failed, total: topics.length };
  }

  /**
   * GET /topics
   * List semua topics dengan jumlah destinasi terkait.
   */
  async findAll(scope?: TopicScope) {
    if (scope === 'detail') {
      return this.findGroups();
    }

    const topics = await this.prisma.topic.findMany({
      where: scope === 'search' ? { isSearchVisible: true } : undefined,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        topicName: true,
        keywords: true,
        labelType: true,
        isSearchVisible: true,
        isDetailVisible: true,
        groupId: true,
        group: {
          select: {
            id: true,
            groupName: true,
          },
        },
        _count: {
          select: { destinationTopics: true },
        },
      },
    });

    return topics.map((t) => ({
      id: t.id,
      topic_name: t.topicName,
      keywords: t.keywords,
      label_type: t.labelType,
      is_search_visible: t.isSearchVisible,
      is_detail_visible: t.isDetailVisible,
      group_id: t.groupId,
      group_name: t.group?.groupName ?? null,
      group: t.group
        ? {
            id: t.group.id,
            group_name: t.group.groupName,
          }
        : null,
      total_destinations: t._count.destinationTopics,
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
            _count: {
              select: { destinationTopics: true },
            },
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

  /**
   * GET /topics/:id/destinations
   * Paginated destinations yang memiliki topic tertentu.
   */
  async findDestinationsByTopic(topicId: number, page: number, limit: number) {
    // Cek topic exists
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, topicName: true },
    });

    if (!topic) {
      throw new NotFoundException('Topic tidak ditemukan');
    }

    const skip = (page - 1) * limit;

    const [destTopics, total] = await Promise.all([
      this.prisma.destinationTopic.findMany({
        where: {
          topicId,
          destination: { deletedAt: null },
        },
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
      this.prisma.destinationTopic.count({
        where: {
          topicId,
          destination: { deletedAt: null },
        },
      }),
    ]);

    const data = destTopics.map((dt) => ({
      ...dt.destination,
      total_reviews_in_topic: dt.totalReviews,
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

  /**
   * PUT /topics/:id/rename
   * Rename topik secara manual oleh admin.
   */
  async renameTopic(
    topicId: number,
    newName: string,
  ): Promise<{ id: number; topicName: string }> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic tidak ditemukan');

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
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic tidak ditemukan');

    if (data.groupId) {
      const group = await this.prisma.topicGroup.findUnique({
        where: { id: data.groupId },
        select: { id: true },
      });
      if (!group) throw new NotFoundException('Topic group tidak ditemukan');
    }

    const updated = await this.prisma.topic.update({
      where: { id: topicId },
      data: {
        ...(data.groupId !== undefined ? { groupId: data.groupId } : {}),
        ...(data.isSearchVisible !== undefined
          ? { isSearchVisible: data.isSearchVisible }
          : {}),
        ...(data.isDetailVisible !== undefined
          ? { isDetailVisible: data.isDetailVisible }
          : {}),
      },
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

  async renameGroup(groupId: number, groupName: string) {
    const group = await this.prisma.topicGroup.findUnique({
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Topic group tidak ditemukan');

    const updated = await this.prisma.topicGroup.update({
      where: { id: groupId },
      data: { groupName },
      select: { id: true, groupName: true },
    });

    return { id: updated.id, group_name: updated.groupName };
  }

  /**
   * DELETE /topics/:id
   * Hapus topik beserta relasi destinationTopic dan unlink review.
   */
  async deleteTopic(
    topicId: number,
  ): Promise<{ deleted: boolean; id: number }> {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
    });
    if (!topic) throw new NotFoundException('Topic tidak ditemukan');

    // Hapus relasi terlebih dahulu, lalu topik
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
}
