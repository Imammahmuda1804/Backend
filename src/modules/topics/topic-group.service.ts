import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { TopicGroupPayload } from './topic.types';

@Injectable()
export class TopicGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async renameGroup(groupId: number, groupName: string) {
    await this.ensureGroupExists(groupId);
    const updated = await this.prisma.topicGroup.update({
      where: { id: groupId },
      data: { groupName },
      select: { id: true, groupName: true },
    });

    return { id: updated.id, group_name: updated.groupName };
  }

  async createGroup(data: TopicGroupPayload) {
    const created = await this.prisma.topicGroup.create({
      data: this.toGroupData(data),
      select: {
        id: true,
        groupName: true,
        description: true,
        keywords: true,
        displayOrder: true,
      },
    });

    return {
      ...this.toGroupResponse(created),
      topics: [],
    };
  }

  async updateGroup(groupId: number, data: TopicGroupPayload) {
    await this.ensureGroupExists(groupId);
    const updated = await this.prisma.topicGroup.update({
      where: { id: groupId },
      data: this.toGroupData(data),
      select: {
        id: true,
        groupName: true,
        description: true,
        keywords: true,
        displayOrder: true,
        topics: {
          select: {
            id: true,
            topicName: true,
            keywords: true,
            isSearchVisible: true,
            isDetailVisible: true,
            _count: { select: { destinationTopics: true } },
          },
        },
      },
    });

    return {
      ...this.toGroupResponse(updated),
      topics: updated.topics.map((topic) => ({
        id: topic.id,
        topic_name: topic.topicName,
        keywords: topic.keywords,
        is_search_visible: topic.isSearchVisible,
        is_detail_visible: topic.isDetailVisible,
        total_destinations: topic._count.destinationTopics,
      })),
    };
  }

  async deleteGroup(groupId: number) {
    const group = await this.prisma.topicGroup.findUnique({
      where: { id: groupId },
      select: { id: true, groupName: true },
    });
    if (!group) throw new NotFoundException('Topic group tidak ditemukan');

    await this.prisma.topicGroup.delete({ where: { id: groupId } });
    return { deleted: true, id: group.id, group_name: group.groupName };
  }

  private async ensureGroupExists(groupId: number) {
    const group = await this.prisma.topicGroup.findUnique({
      where: { id: groupId },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Topic group tidak ditemukan');
  }

  private toGroupData(data: TopicGroupPayload) {
    return {
      groupName: data.groupName.trim(),
      description: data.description?.trim() || null,
      keywords: this.normalizeKeywords(data.keywords),
      displayOrder: data.displayOrder ?? 0,
    };
  }

  private toGroupResponse(group: {
    id: number;
    groupName: string;
    description: string | null;
    keywords: unknown;
    displayOrder: number;
  }) {
    return {
      id: group.id,
      group_name: group.groupName,
      description: group.description,
      keywords: group.keywords,
      display_order: group.displayOrder,
    };
  }

  private normalizeKeywords(keywords?: string[]) {
    const cleanKeywords = (keywords ?? [])
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    return [...new Set(cleanKeywords)].slice(0, 24);
  }
}
