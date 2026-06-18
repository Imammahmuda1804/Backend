import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ReviewTopicAssignment,
  ReviewTopicQueryService,
} from '../topic-mapping/review-topic-query.service';

type TopicGroupAggregation = {
  groupId: number;
  groupName: string;
  totalReviews: number;
  sentimentBreakdown: { positive: number; negative: number; neutral: number };
  topics: Map<number, { id: number; topicName: string; totalReviews: number }>;
};

type TopicGroupRow = {
  topicId: number | null;
  sentiment: string | null;
  _count: { sentiment: number };
};

type VisibleTopic = {
  id: number;
  topicName: string;
  groupId: number | null;
  group: { id: number; groupName: string } | null;
};

type FallbackTopicGroup = { id: number; groupName: string } | null;
type SentimentBucket = 'positive' | 'negative' | 'neutral';

const SENTIMENT_BUCKET_MAP: Record<string, SentimentBucket> = {
  positive: 'positive',
  positif: 'positive',
  negative: 'negative',
  negatif: 'negative',
};

function normalizeSentimentBucket(sentiment: string | null): SentimentBucket {
  const normalized = (sentiment || '').toLowerCase();
  return SENTIMENT_BUCKET_MAP[normalized] ?? 'neutral';
}

@Injectable()
export class DestinationDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewTopics: ReviewTopicQueryService,
  ) {}
  // Mengambil detail publik destinasi berdasarkan id.
  async findOnePublic(id: number) {
    return this.findPublicDestination({ id, deletedAt: null }, 'desc');
  }

  // Mengambil detail publik destinasi berdasarkan slug.
  async findOnePublicBySlug(slug: string) {
    return this.findPublicDestination({ slug, deletedAt: null }, 'asc', true);
  }

  private async findPublicDestination(
    where: Prisma.DestinationWhereInput,
    sentimentTrendOrder: Prisma.SortOrder,
    includeTopicGroup = false,
  ) {
    const destination = await this.prisma.destination.findFirst({
      where,
      include: this.buildPublicDetailInclude(
        sentimentTrendOrder,
        includeTopicGroup,
      ),
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    return this.withPublicDetailAggregates(destination);
  }

  private buildPublicDetailInclude(
    sentimentTrendOrder: Prisma.SortOrder,
    includeTopicGroup: boolean,
  ): Prisma.DestinationInclude {
    return {
      images: true,
      sentimentTrends: {
        orderBy: { date: sentimentTrendOrder },
        take: 30,
      },
      destinationTopics: {
        include: includeTopicGroup
          ? { topic: { include: { group: true } } }
          : { topic: true },
      },
      userReviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profilePicture: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    };
  }

  // Mengambil review Google Maps yang berkaitan dengan satu topik sempit.
  async getReviewsByTopic(
    destinationId: number,
    topicId: number,
    page: number,
    limit: number,
  ) {
    await this.assertPublicDestinationExists(destinationId);

    const skip = (page - 1) * limit;

    const pageResult = await this.reviewTopics.findReviewPage({
      topicIds: [topicId],
      destinationId,
      skip,
      take: limit,
    });
    const reviews = await this.findOrderedReviews(pageResult.reviewIds, {
      id: true,
      reviewerName: true,
      reviewText: true,
      rating: true,
      reviewDate: true,
      sentiment: true,
      likesCount: true,
    });

    return {
      data: this.withTopicAssignments(
        reviews,
        pageResult.assignmentsByReviewId,
      ),
      meta: {
        total: pageResult.total,
        page,
        limit,
        totalPages: Math.ceil(pageResult.total / limit),
      },
    };
  }

  private async findOrderedReviews<TSelect extends Prisma.ReviewSelect>(
    reviewIds: number[],
    select: TSelect,
  ) {
    if (reviewIds.length === 0) return [];

    const reviews = await this.prisma.review.findMany({
      where: { id: { in: reviewIds } },
      select: {
        ...select,
      },
    });

    const order = new Map(reviewIds.map((id, index) => [id, index]));
    return reviews.sort((left, right) => {
      const leftId = Number((left as { id: number }).id);
      const rightId = Number((right as { id: number }).id);
      return (
        (order.get(leftId) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(rightId) ?? Number.MAX_SAFE_INTEGER)
      );
    });
  }

  // Mengambil review dari semua topik sempit dalam satu topic group.
  async getReviewsByTopicGroup(
    destinationId: number,
    groupId: number,
    page: number,
    limit: number,
  ) {
    await this.assertPublicDestinationExists(destinationId);

    const topics = await this.prisma.topic.findMany({
      where: { groupId },
      select: { id: true },
    });
    const topicIds = topics.map((topic) => topic.id);

    if (topicIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    const skip = (page - 1) * limit;

    const pageResult = await this.reviewTopics.findReviewPage({
      topicIds,
      destinationId,
      skip,
      take: limit,
    });
    const reviews = await this.findOrderedReviews(pageResult.reviewIds, {
      id: true,
      reviewerName: true,
      reviewText: true,
      rating: true,
      reviewDate: true,
      sentiment: true,
      likesCount: true,
      topicId: true,
      topic: {
        select: {
          id: true,
          topicName: true,
        },
      },
    });

    return {
      data: this.withTopicAssignments(
        reviews,
        pageResult.assignmentsByReviewId,
      ),
      meta: {
        total: pageResult.total,
        page,
        limit,
        totalPages: Math.ceil(pageResult.total / limit),
      },
    };
  }

  private withTopicAssignments<TReview extends { id: number }>(
    reviews: TReview[],
    assignmentsByReviewId: Map<number, ReviewTopicAssignment[]>,
  ) {
    return reviews.map((review) => ({
      ...review,
      topicAssignments: assignmentsByReviewId.get(review.id) ?? [],
    }));
  }

  // Mengelompokkan topik sempit menjadi topic group untuk halaman detail.
  private async buildTopicGroups(destinationId: number) {
    const grouped = await this.loadTopicGroupRows(destinationId);
    const topicIds = this.extractTopicIds(grouped);

    if (topicIds.length === 0) return [];

    const { topicMap, fallbackGroup } =
      await this.loadTopicGroupContext(topicIds);
    const groups = this.aggregateTopicGroups(grouped, topicMap, fallbackGroup);

    return this.formatTopicGroups(groups);
  }

  private async loadTopicGroupRows(destinationId: number) {
    const rows = await this.reviewTopics.getTopicSentimentCounts(destinationId);

    return rows.map((row) => ({
      topicId: row.topicId,
      sentiment: row.sentiment,
      _count: { sentiment: row.count },
    }));
  }

  private extractTopicIds(rows: Array<{ topicId: number | null }>) {
    return Array.from(
      new Set(
        rows
          .map((row) => row.topicId)
          .filter((topicId): topicId is number => topicId !== null),
      ),
    );
  }

  private async loadTopicGroupContext(topicIds: number[]) {
    const topics = await this.prisma.topic.findMany({
      where: {
        id: { in: topicIds },
        isDetailVisible: true,
      },
      select: {
        id: true,
        topicName: true,
        groupId: true,
        group: { select: { id: true, groupName: true } },
      },
    });

    const fallbackGroup = await this.prisma.topicGroup.findFirst({
      where: { groupName: { contains: 'Lain', mode: 'insensitive' } },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, groupName: true },
    });

    return {
      topicMap: new Map(topics.map((topic) => [topic.id, topic])),
      fallbackGroup,
    };
  }

  private aggregateTopicGroups(
    rows: TopicGroupRow[],
    topicMap: Map<number, VisibleTopic>,
    fallbackGroup: FallbackTopicGroup,
  ) {
    const groups = new Map<number, TopicGroupAggregation>();

    for (const row of rows) {
      if (row.topicId === null) continue;
      const topic = topicMap.get(row.topicId);
      if (!topic) continue;

      const group = this.getTopicGroupAggregation(groups, topic, fallbackGroup);
      this.addTopicGroupRow(group, topic, row);
      groups.set(group.groupId, group);
    }

    return groups;
  }

  private getTopicGroupAggregation(
    groups: Map<number, TopicGroupAggregation>,
    topic: VisibleTopic,
    fallbackGroup: FallbackTopicGroup,
  ) {
    const groupIdentity = this.resolveTopicGroupIdentity(topic, fallbackGroup);

    return (
      groups.get(groupIdentity.groupId) ??
      this.createEmptyTopicGroupAggregation(groupIdentity)
    );
  }

  private resolveTopicGroupIdentity(
    topic: VisibleTopic,
    fallbackGroup: FallbackTopicGroup,
  ) {
    return {
      groupId: this.resolveTopicGroupId(topic, fallbackGroup),
      groupName: this.resolveTopicGroupName(topic, fallbackGroup),
    };
  }

  private resolveTopicGroupId(
    topic: VisibleTopic,
    fallbackGroup: FallbackTopicGroup,
  ) {
    if (topic.groupId !== null) return topic.groupId;
    if (fallbackGroup) return fallbackGroup.id;
    return 0;
  }

  private resolveTopicGroupName(
    topic: VisibleTopic,
    fallbackGroup: FallbackTopicGroup,
  ) {
    if (topic.group) return topic.group.groupName;
    if (fallbackGroup) return fallbackGroup.groupName;
    return 'Lainnya';
  }

  private createEmptyTopicGroupAggregation(input: {
    groupId: number;
    groupName: string;
  }): TopicGroupAggregation {
    return {
      groupId: input.groupId,
      groupName: input.groupName,
      totalReviews: 0,
      sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
      topics: new Map<
        number,
        { id: number; topicName: string; totalReviews: number }
      >(),
    };
  }

  private addTopicGroupRow(
    group: TopicGroupAggregation,
    topic: VisibleTopic,
    row: TopicGroupRow,
  ) {
    const count = row._count.sentiment;
    group.totalReviews += count;
    this.addTopicGroupSentiment(group, row.sentiment, count);

    const fineTopic = group.topics.get(topic.id) ?? {
      id: topic.id,
      topicName: topic.topicName,
      totalReviews: 0,
    };
    fineTopic.totalReviews += count;
    group.topics.set(topic.id, fineTopic);
  }

  private addTopicGroupSentiment(
    group: TopicGroupAggregation,
    sentiment: string | null,
    count: number,
  ) {
    group.sentimentBreakdown[normalizeSentimentBucket(sentiment)] += count;
  }

  private formatTopicGroups(groups: Map<number, TopicGroupAggregation>) {
    return Array.from(groups.values())
      .map((group) => ({
        groupId: group.groupId,
        groupName: group.groupName,
        totalReviews: group.totalReviews,
        sentimentBreakdown: group.sentimentBreakdown,
        topics: Array.from(group.topics.values()).sort(
          (a, b) => b.totalReviews - a.totalReviews,
        ),
      }))
      .sort((a, b) => b.totalReviews - a.totalReviews);
  }

  private async assertPublicDestinationExists(id: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }
  }

  private async withPublicDetailAggregates<
    TDestination extends { id: number; userRating: number | null },
  >(destination: TDestination) {
    const [reviewAgg, scrapedAgg, topicSentimentBreakdown, topicGroups] =
      await Promise.all([
        this.prisma.userReview.aggregate({
          where: { destinationId: destination.id },
          _avg: { rating: true },
          _count: true,
        }),
        this.prisma.review.aggregate({
          where: { destinationId: destination.id },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        this.buildTopicSentimentBreakdown(destination.id),
        this.buildTopicGroups(destination.id),
      ]);

    return {
      ...destination,
      averageUserRating: reviewAgg._avg.rating || null,
      totalUserReviews: reviewAgg._count,
      scrapedAverageRating: scrapedAgg._avg.rating
        ? parseFloat(scrapedAgg._avg.rating.toFixed(2))
        : destination.userRating,
      scrapedReviewCount: scrapedAgg._count.rating,
      topicSentimentBreakdown,
      topicGroups,
    };
  }

  // Membuat ringkasan sentimen per topik.
  // Menghitung sentimen positif, negatif, dan netral per topik.
  private async buildTopicSentimentBreakdown(
    destinationId: number,
  ): Promise<
    Record<number, { positive: number; negative: number; neutral: number }>
  > {
    const grouped =
      await this.reviewTopics.getTopicSentimentCounts(destinationId);

    const breakdown: Record<
      number,
      { positive: number; negative: number; neutral: number }
    > = {};

    for (const row of grouped) {
      if (!breakdown[row.topicId]) {
        breakdown[row.topicId] = { positive: 0, negative: 0, neutral: 0 };
      }
      const bucket = normalizeSentimentBucket(row.sentiment);
      breakdown[row.topicId][bucket] = row.count;
    }

    return breakdown;
  }
}
