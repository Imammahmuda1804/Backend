import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReviewTopicQueryService } from '../topic-mapping/review-topic-query.service';
import { AnalyticsPeriod } from './analytics.types';
import {
  buildSentimentDistribution,
  getAnalyticsPeriodKey,
  normalizeAnalyticsSentiment,
  toSortedTrendRows,
} from './analytics.utils';

type StatusCountRow = {
  status: string;
  _count: { status: number };
};

type TopicSentimentRow = {
  topicId: number;
  sentiment: string | null;
  count: number;
};

type TopicRiskMetric = {
  topic_name: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  risk_ratio: number;
};

@Injectable()
export class DashboardAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviewTopics: ReviewTopicQueryService,
  ) {}
  // Mengambil ringkasan dashboard admin.
  async getAdminSummary() {
    const data = await this.loadAdminSummaryData();
    const topicMap = await this.fetchTopicNameMap(
      data.topTopics.map((topic) => topic.topicId),
    );
    const topicRiskMatrix = await this.buildTopicRiskMatrix(
      data.topicSentimentRows,
    );
    const userBreakdown = this.toStatusBreakdown(data.userCounts);
    const jobBreakdown = this.toStatusBreakdown(data.scrapingJobCounts);
    const latestCompletedJob = this.findJobByStatus(
      data.latestScrapingJobs,
      'completed',
    );
    const latestFailedJob = this.findJobByStatus(
      data.latestScrapingJobs,
      'failed',
    );
    const totalUsers = this.sumBreakdown(userBreakdown);
    const totalScrapingJobs = this.sumBreakdown(jobBreakdown);

    return {
      total_users: totalUsers,
      users_breakdown: userBreakdown,
      total_destinations: data.activeDestCount,
      destinations_breakdown: {
        active: data.activeDestCount,
        deleted: data.deletedDestCount,
      },
      total_reviews: data.scrapedReviewCount + data.userReviewCount,
      reviews_breakdown: {
        scraped: data.scrapedReviewCount,
        user_submitted: data.userReviewCount,
      },
      total_scraping_jobs: totalScrapingJobs,
      scraping_jobs_breakdown: jobBreakdown,
      sentiment_distribution: buildSentimentDistribution(data.sentimentCounts),
      top_destinations: data.topDestinations,
      latest_scraping_jobs: data.latestScrapingJobs,
      top_topics: this.mapTopTopics(data.topTopics, topicMap),
      data_freshness: {
        latest_completed_job: latestCompletedJob,
        latest_failed_job: latestFailedJob,
        destinations_without_thumbnail: data.destinationsMissingThumbnail,
        destinations_without_trends: data.destinationsMissingTrends,
      },
      action_queue: {
        failed_jobs: this.getStatusCount(jobBreakdown, 'failed'),
        pending_jobs: this.getStatusCount(jobBreakdown, 'pending'),
        destinations_without_thumbnail: data.destinationsMissingThumbnail,
        destinations_without_trends: data.destinationsMissingTrends,
        recent_negative_reviews: data.recentNegativeReviews,
      },
      topic_risk_matrix: topicRiskMatrix,
      destination_quality_matrix: data.destinationQualityRows.map((item) =>
        this.toDestinationQualityRow(item),
      ),
    };
  }

  private sumBreakdown(breakdown: Record<string, number>) {
    return Object.values(breakdown).reduce((total, count) => total + count, 0);
  }

  private getStatusCount(breakdown: Record<string, number>, status: string) {
    const upperCaseCount = breakdown[status.toUpperCase()];
    if (upperCaseCount !== undefined) return upperCaseCount;

    const lowerCaseCount = breakdown[status.toLowerCase()];
    if (lowerCaseCount !== undefined) return lowerCaseCount;

    return 0;
  }

  private mapTopTopics(
    topics: Array<{ topicId: number; _sum: { totalReviews: number | null } }>,
    topicMap: Map<number, string>,
  ) {
    return topics.map((topic) => ({
      topic_name: topicMap.get(topic.topicId) ?? 'Unknown',
      count: topic._sum.totalReviews ?? 0,
    }));
  }

  private toDestinationQualityRow(destination: {
    id: number;
    name: string;
    city: string | null;
    googleRating: number | null;
    googleReviewCount: number | null;
    recommendationScore: number | null;
    positiveRatio: number | null;
  }) {
    return {
      id: destination.id,
      name: destination.name,
      city: destination.city,
      google_rating: destination.googleRating,
      google_review_count: destination.googleReviewCount,
      recommendation_score: destination.recommendationScore,
      positive_ratio: destination.positiveRatio,
    };
  }

  private async loadAdminSummaryData() {
    const [
      userCounts,
      activeDestCount,
      deletedDestCount,
      scrapedReviewCount,
      userReviewCount,
      scrapingJobCounts,
      sentimentCounts,
      topDestinations,
      latestScrapingJobs,
      topTopics,
      destinationsMissingThumbnail,
      destinationsMissingTrends,
      recentNegativeReviews,
      topicSentimentRows,
      destinationQualityRows,
    ] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.destination.count({ where: { deletedAt: null } }),
      this.prisma.destination.count({ where: { deletedAt: { not: null } } }),
      this.prisma.review.count(),
      this.prisma.userReview.count(),
      this.prisma.scrapingJob.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.review.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { sentiment: { not: null } },
      }),
      this.prisma.destination.findMany({
        where: { deletedAt: null, recommendationScore: { not: null } },
        orderBy: { recommendationScore: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          city: true,
          recommendationScore: true,
          positiveRatio: true,
          googleRating: true,
        },
      }),
      this.prisma.scrapingJob.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          destination: { select: { name: true, city: true } },
        },
      }),
      this.prisma.destinationTopic.groupBy({
        by: ['topicId'],
        _sum: { totalReviews: true },
        orderBy: { _sum: { totalReviews: 'desc' } },
        take: 5,
      }),
      this.prisma.destination.count({
        where: {
          deletedAt: null,
          OR: [{ thumbnailUrl: null }, { thumbnailUrl: '' }],
        },
      }),
      this.prisma.destination.count({
        where: {
          deletedAt: null,
          sentimentTrends: { none: {} },
        },
      }),
      this.prisma.review.findMany({
        where: { sentiment: { in: ['negative', 'negatif'] } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          rating: true,
          reviewText: true,
          createdAt: true,
          destination: { select: { id: true, name: true, city: true } },
        },
      }),
      this.reviewTopics.getTopicSentimentCounts(),
      this.prisma.destination.findMany({
        where: {
          deletedAt: null,
          OR: [
            { recommendationScore: { not: null } },
            { googleRating: { not: null } },
            { positiveRatio: { not: null } },
          ],
        },
        orderBy: [{ recommendationScore: 'desc' }, { googleRating: 'desc' }],
        take: 24,
        select: {
          id: true,
          name: true,
          city: true,
          googleRating: true,
          googleReviewCount: true,
          recommendationScore: true,
          positiveRatio: true,
        },
      }),
    ]);

    return {
      userCounts,
      activeDestCount,
      deletedDestCount,
      scrapedReviewCount,
      userReviewCount,
      scrapingJobCounts,
      sentimentCounts,
      topDestinations,
      latestScrapingJobs,
      topTopics,
      destinationsMissingThumbnail,
      destinationsMissingTrends,
      recentNegativeReviews,
      topicSentimentRows,
      destinationQualityRows,
    };
  }

  private async fetchTopicNameMap(topicIds: number[]) {
    if (topicIds.length === 0) return new Map<number, string>();

    const topics = await this.prisma.topic.findMany({
      where: { id: { in: [...new Set(topicIds)] } },
      select: { id: true, topicName: true },
    });
    return new Map(topics.map((topic) => [topic.id, topic.topicName]));
  }

  private async buildTopicRiskMatrix(rows: TopicSentimentRow[]) {
    const topicIds = rows.map((row) => row.topicId);
    const topicNameMap = await this.fetchTopicNameMap(topicIds);
    const riskMap = new Map<number, TopicRiskMetric>();

    for (const row of rows) {
      const metric = this.getTopicRiskMetric(
        riskMap,
        row.topicId,
        topicNameMap,
      );
      this.applySentimentCount(metric, row.sentiment, row.count);
      riskMap.set(row.topicId, metric);
    }

    return Array.from(riskMap.values())
      .sort((a, b) => b.risk_ratio - a.risk_ratio || b.total - a.total)
      .slice(0, 8);
  }

  private getTopicRiskMetric(
    riskMap: Map<number, TopicRiskMetric>,
    topicId: number,
    topicNameMap: Map<number, string>,
  ): TopicRiskMetric {
    return (
      riskMap.get(topicId) ?? {
        topic_name: topicNameMap.get(topicId) ?? 'Unknown',
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
        risk_ratio: 0,
      }
    );
  }

  private applySentimentCount(
    metric: TopicRiskMetric,
    sentiment: string | null,
    count: number,
  ) {
    const normalized = this.normalizeSentiment(sentiment);
    metric[normalized] += count;
    metric.total += count;
    metric.risk_ratio = metric.total > 0 ? metric.negative / metric.total : 0;
  }

  private normalizeSentiment(
    sentiment: string | null | undefined,
  ): 'positive' | 'negative' | 'neutral' {
    return normalizeAnalyticsSentiment(sentiment);
  }

  private toStatusBreakdown(rows: StatusCountRow[]) {
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count.status;
      return acc;
    }, {});
  }

  private findJobByStatus<T extends { status: string | null | undefined }>(
    jobs: T[],
    expected: string,
  ) {
    return (
      jobs.find(
        (job) => (job.status ?? '').toLowerCase() === expected.toLowerCase(),
      ) ?? null
    );
  }

  // Mengambil aktivitas terbaru admin.
  async getAdminActivity() {
    const [recentJobs, recentScrapedReviews, recentUserReviews, recentUsers] =
      await Promise.all([
        // 10 recent scraping jobs
        this.prisma.scrapingJob.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            destination: { select: { name: true } },
          },
        }),

        // 10 recent scraped reviews
        this.prisma.review.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            reviewerName: true,
            rating: true,
            sentiment: true,
            createdAt: true,
            destination: { select: { name: true } },
          },
        }),

        // 10 recent user reviews
        this.prisma.userReview.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            rating: true,
            reviewText: true,
            createdAt: true,
            user: { select: { name: true } },
            destination: { select: { name: true } },
          },
        }),

        // 10 recent user registrations
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
          },
        }),
      ]);

    return {
      recent_scraping_jobs: recentJobs,
      recent_scraped_reviews: recentScrapedReviews,
      recent_user_reviews: recentUserReviews,
      recent_registrations: recentUsers,
    };
  }

  // Mengambil tren dashboard admin.
  async getAdminTrends(period: AnalyticsPeriod = 'monthly') {
    const dateFrom = this.getAdminTrendStartDate(period);

    const trends = await this.prisma.sentimentTrend.findMany({
      where: { date: { gte: dateFrom } },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        positiveCount: true,
        negativeCount: true,
        neutralCount: true,
      },
    });

    const grouped = this.groupAdminTrendRows(trends, period);
    const result = toSortedTrendRows(grouped);

    return { period, trends: result };
  }

  private getAdminTrendStartDate(period: AnalyticsPeriod) {
    const now = new Date();
    const dateFrom = new Date(now);

    if (period === 'daily') dateFrom.setDate(now.getDate() - 30);
    if (period === 'weekly') dateFrom.setDate(now.getDate() - 84);
    if (period === 'monthly') dateFrom.setMonth(now.getMonth() - 12);

    return dateFrom;
  }

  private groupAdminTrendRows(
    trends: Array<{
      date: Date;
      positiveCount: number;
      negativeCount: number;
      neutralCount: number;
    }>,
    period: AnalyticsPeriod,
  ) {
    const grouped = new Map<
      string,
      { positive: number; negative: number; neutral: number; total: number }
    >();

    for (const t of trends) {
      const key = getAnalyticsPeriodKey(t.date, period);
      const existing = grouped.get(key) ?? {
        positive: 0,
        negative: 0,
        neutral: 0,
        total: 0,
      };
      const pos = existing.positive + t.positiveCount;
      const neg = existing.negative + t.negativeCount;
      const neu = existing.neutral + t.neutralCount;
      grouped.set(key, {
        positive: pos,
        negative: neg,
        neutral: neu,
        total: pos + neg + neu,
      });
    }

    return grouped;
  }
}
