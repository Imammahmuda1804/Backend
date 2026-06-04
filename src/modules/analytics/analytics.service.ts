import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type CompareTopicSignal = {
  topic_name: string;
  total_reviews: number;
  group_name?: string | null;
};

type CompareFactorKey =
  | 'access'
  | 'cost_value'
  | 'cleanliness'
  | 'facilities'
  | 'crowd'
  | 'view_activity';

type CompareDestinationSnapshot = {
  id: number;
  name: string;
  slug: string;
  city: string;
  province: string;
  category: string;
  thumbnailUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  googleMapsUrl: string | null;
  sentiment: { positive: number; neutral: number; negative: number };
  topics: CompareTopicSignal[];
  top_topics: CompareTopicSignal[];
  topic_groups: Array<{ group_name: string; total_reviews: number }>;
  rating: { google: number | null; user: number | null };
  recommendation_score: number | null;
  positive_ratio: number | null;
  review_count: number;
  travel_traits: Record<string, number>;
  decision_factors: Record<CompareFactorKey, number>;
  highlights: string[];
  risks: string[];
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // Mengambil statistik dashboard publik.
  async getPublicDashboard() {
    const [
      totalDestinations,
      totalReviews,
      sentimentCounts,
      topTopics,
      topRecommendations,
    ] = await Promise.all([
      this.prisma.destination.count({ where: { deletedAt: null } }),

      this.prisma.review.count(),

      this.prisma.review.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { sentiment: { not: null } },
      }),

      this.prisma.destinationTopic.groupBy({
        by: ['topicId'],
        _sum: { totalReviews: true },
        orderBy: { _sum: { totalReviews: 'desc' } },
        take: 5,
      }),

      this.prisma.destination.findMany({
        where: { deletedAt: null, recommendationScore: { not: null } },
        orderBy: { recommendationScore: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          thumbnailUrl: true,
          recommendationScore: true,
          positiveRatio: true,
        },
      }),
    ]);

    // Mengambil nama topik.
    const topicIds = topTopics.map((t) => t.topicId);
    const topics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, topicName: true },
    });
    const topicMap = new Map(topics.map((t) => [t.id, t.topicName]));

    const sentimentDist = this.buildSentimentDist(sentimentCounts);

    return {
      total_destinations: totalDestinations,
      total_reviews: totalReviews,
      sentiment_distribution: sentimentDist,
      top_topics: topTopics.map((t) => ({
        topic_name: topicMap.get(t.topicId) ?? 'Unknown',
        count: t._sum.totalReviews ?? 0,
      })),
      top_recommendations: topRecommendations,
    };
  }

  // Mengambil ringkasan dashboard admin.
  async getAdminSummary() {
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
      // Menghitung status user.
      this.prisma.user.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Menghitung destinasi aktif.
      this.prisma.destination.count({ where: { deletedAt: null } }),

      // Menghitung destinasi soft delete.
      this.prisma.destination.count({ where: { deletedAt: { not: null } } }),

      // Menghitung review Google Maps.
      this.prisma.review.count(),

      // Menghitung review user aplikasi.
      this.prisma.userReview.count(),

      // Menghitung job scraping per status.
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

      this.prisma.review.groupBy({
        by: ['topicId', 'sentiment'],
        where: { topicId: { not: null }, sentiment: { not: null } },
        _count: { _all: true },
      }),

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

    // Mengambil nama topik.
    const topicIds = topTopics.map((t) => t.topicId);
    const topics = await this.prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, topicName: true },
    });
    const topicMap = new Map(topics.map((t) => [t.id, t.topicName]));

    const topicRiskIds = [
      ...new Set(
        topicSentimentRows
          .map((row) => row.topicId)
          .filter((id): id is number => id !== null),
      ),
    ];
    const riskTopics = await this.prisma.topic.findMany({
      where: { id: { in: topicRiskIds } },
      select: { id: true, topicName: true },
    });
    const riskTopicMap = new Map(
      riskTopics.map((topic) => [topic.id, topic.topicName]),
    );

    const topicRiskMap = new Map<
      number,
      {
        topic_name: string;
        positive: number;
        neutral: number;
        negative: number;
        total: number;
        risk_ratio: number;
      }
    >();
    for (const row of topicSentimentRows) {
      if (row.topicId === null) continue;
      const existing = topicRiskMap.get(row.topicId) ?? {
        topic_name: riskTopicMap.get(row.topicId) ?? 'Unknown',
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
        risk_ratio: 0,
      };
      const count = row._count._all;
      const sentiment = (row.sentiment || '').toLowerCase();
      if (sentiment === 'positive' || sentiment === 'positif')
        existing.positive += count;
      else if (sentiment === 'negative' || sentiment === 'negatif')
        existing.negative += count;
      else existing.neutral += count;
      existing.total += count;
      existing.risk_ratio =
        existing.total > 0 ? existing.negative / existing.total : 0;
      topicRiskMap.set(row.topicId, existing);
    }

    const hasStatus = (status: string | null | undefined, expected: string) =>
      (status ?? '').toLowerCase() === expected;
    const latestCompletedJob =
      latestScrapingJobs.find((job) => hasStatus(job.status, 'completed')) ??
      null;
    const latestFailedJob =
      latestScrapingJobs.find((job) => hasStatus(job.status, 'failed')) ?? null;
    const userBreakdown: Record<string, number> = {};
    for (const u of userCounts) {
      userBreakdown[u.status] = u._count.status;
    }
    const jobBreakdown: Record<string, number> = {};
    for (const j of scrapingJobCounts) {
      jobBreakdown[j.status] = j._count.status;
    }

    return {
      total_users: Object.values(userBreakdown).reduce((a, b) => a + b, 0),
      users_breakdown: userBreakdown,
      total_destinations: activeDestCount,
      destinations_breakdown: {
        active: activeDestCount,
        deleted: deletedDestCount,
      },
      total_reviews: scrapedReviewCount + userReviewCount,
      reviews_breakdown: {
        scraped: scrapedReviewCount,
        user_submitted: userReviewCount,
      },
      total_scraping_jobs: Object.values(jobBreakdown).reduce(
        (a, b) => a + b,
        0,
      ),
      scraping_jobs_breakdown: jobBreakdown,
      sentiment_distribution: this.buildSentimentDist(sentimentCounts),
      top_destinations: topDestinations,
      latest_scraping_jobs: latestScrapingJobs,
      top_topics: topTopics.map((t) => ({
        topic_name: topicMap.get(t.topicId) ?? 'Unknown',
        count: t._sum.totalReviews ?? 0,
      })),
      data_freshness: {
        latest_completed_job: latestCompletedJob,
        latest_failed_job: latestFailedJob,
        destinations_without_thumbnail: destinationsMissingThumbnail,
        destinations_without_trends: destinationsMissingTrends,
      },
      action_queue: {
        failed_jobs: jobBreakdown.FAILED ?? jobBreakdown.failed ?? 0,
        pending_jobs: jobBreakdown.PENDING ?? jobBreakdown.pending ?? 0,
        destinations_without_thumbnail: destinationsMissingThumbnail,
        destinations_without_trends: destinationsMissingTrends,
        recent_negative_reviews: recentNegativeReviews,
      },
      topic_risk_matrix: Array.from(topicRiskMap.values())
        .sort((a, b) => b.risk_ratio - a.risk_ratio || b.total - a.total)
        .slice(0, 8),
      destination_quality_matrix: destinationQualityRows.map((destination) => ({
        id: destination.id,
        name: destination.name,
        city: destination.city,
        google_rating: destination.googleRating,
        google_review_count: destination.googleReviewCount,
        recommendation_score: destination.recommendationScore,
        positive_ratio: destination.positiveRatio,
      })),
    };
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
  async getAdminTrends(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    // Tentukan batas waktu berdasarkan period
    const now = new Date();
    let dateFrom: Date;
    if (period === 'daily') {
      dateFrom = new Date(now);
      dateFrom.setDate(now.getDate() - 30); // last 30 days
    } else if (period === 'weekly') {
      dateFrom = new Date(now);
      dateFrom.setDate(now.getDate() - 84); // last 12 weeks (~84 days)
    } else {
      dateFrom = new Date(now);
      dateFrom.setMonth(now.getMonth() - 12); // last 12 months
    }

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

    // Mengelompokkan data per periode.
    const grouped = new Map<
      string,
      { positive: number; negative: number; neutral: number; total: number }
    >();

    for (const t of trends) {
      const key = this.getPeriodKey(t.date, period);
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

    const result = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return { period, trends: result };
  }

  // Mengambil analytics satu destinasi.
  async getDestinationAnalytics(destinationId: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        googleRating: true,
        userRating: true,
        positiveRatio: true,
        recommendationScore: true,
      },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const [sentimentCounts, totalReviews, avgRating] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { destinationId, sentiment: { not: null } },
      }),

      this.prisma.review.count({ where: { destinationId } }),

      this.prisma.review.aggregate({
        where: { destinationId, rating: { not: null } },
        _avg: { rating: true },
      }),
    ]);

    return {
      destination_id: destination.id,
      destination_name: destination.name,
      total_reviews: totalReviews,
      sentiment_distribution: this.buildSentimentDist(sentimentCounts),
      average_rating: avgRating._avg.rating ?? destination.googleRating ?? null,
      positive_ratio: destination.positiveRatio,
      recommendation_score: destination.recommendationScore,
    };
  }

  // Mengambil analytics satu destinasi.
  async getDestinationTopics(destinationId: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const destTopics = await this.prisma.destinationTopic.findMany({
      where: { destinationId },
      include: { topic: { select: { topicName: true } } },
      orderBy: { totalReviews: 'desc' },
    });

    const total = destTopics.reduce((sum, t) => sum + t.totalReviews, 0);

    const topics = destTopics.map((t) => ({
      topic_name: t.topic.topicName,
      total_reviews: t.totalReviews,
      percentage: total > 0 ? Math.round((t.totalReviews / total) * 100) : 0,
    }));

    return { topics };
  }

  // Mengambil tren sentimen destinasi.
  async getDestinationTrends(
    destinationId: number,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const rawTrends = await this.prisma.sentimentTrend.findMany({
      where: { destinationId },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        positiveCount: true,
        negativeCount: true,
        neutralCount: true,
      },
    });

    // Mengelompokkan data per periode.
    const grouped = new Map<
      string,
      { positive: number; negative: number; neutral: number }
    >();

    for (const t of rawTrends) {
      const key = this.getPeriodKey(t.date, period);
      const existing = grouped.get(key) ?? {
        positive: 0,
        negative: 0,
        neutral: 0,
      };
      grouped.set(key, {
        positive: existing.positive + t.positiveCount,
        negative: existing.negative + t.negativeCount,
        neutral: existing.neutral + t.neutralCount,
      });
    }

    const trends = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return { trends };
  }

  // Membandingkan analytics dua destinasi.
  async compareDestinations(id1: number, id2: number) {
    const [dest1, dest2] = await Promise.all([
      this.getDestinationSnapshot(id1),
      this.getDestinationSnapshot(id2),
    ]);

    if (!dest1) {
      throw new BadRequestException(
        `Destinasi dengan id ${id1} tidak ditemukan`,
      );
    }
    if (!dest2) {
      throw new BadRequestException(
        `Destinasi dengan id ${id2} tidak ditemukan`,
      );
    }

    // Menentukan destinasi unggul.
    const sentimentWinner =
      (dest1.positive_ratio ?? 0) >= (dest2.positive_ratio ?? 0) ? id1 : id2;
    const ratingWinner =
      (dest1.rating.google ?? 0) >= (dest2.rating.google ?? 0) ? id1 : id2;
    const recommendationWinner =
      (dest1.recommendation_score ?? 0) >= (dest2.recommendation_score ?? 0)
        ? id1
        : id2;
    const scoreDiff = Math.abs(
      (dest1.recommendation_score ?? 0) - (dest2.recommendation_score ?? 0),
    );
    const recommended = this.pickRecommendedDestination(dest1, dest2);

    return {
      destination1: dest1,
      destination2: dest2,
      comparison: {
        sentiment_winner: sentimentWinner,
        rating_winner: ratingWinner,
        recommendation_winner: recommendationWinner,
        score_difference: Math.round(scoreDiff * 1000) / 1000,
        insights: this.buildCompareInsights(dest1, dest2, recommended),
      },
    };
  }

  // Mengekspor analytics destinasi ke CSV.
  async exportAnalyticsCsv(
    destinationId: number,
  ): Promise<{ csv: string; filename: string }> {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }

    const reviews = await this.prisma.review.findMany({
      where: { destinationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        reviewText: true,
        cleanedText: true,
        sentiment: true,
        reviewDate: true,
        likesCount: true,
        topic: { select: { topicName: true } },
      },
    });

    // Menulis ringkasan di awal CSV.
    const totalReviews = reviews.length;
    const positiveCount = reviews.filter(
      (r) => r.sentiment === 'positive',
    ).length;
    const negativeCount = reviews.filter(
      (r) => r.sentiment === 'negative',
    ).length;
    const neutralCount = reviews.filter(
      (r) => r.sentiment === 'neutral',
    ).length;

    const rows: string[] = [
      // Menulis header ringkasan.
      `# Destination: ${destination.name}`,
      `# Total Reviews: ${totalReviews} | Positive: ${positiveCount} | Negative: ${negativeCount} | Neutral: ${neutralCount}`,
      `# Exported at: ${new Date().toISOString()}`,
      // Menulis header kolom.
      'id,reviewer_name,rating,sentiment,topic,review_date,likes_count,review_text',
    ];

    const escape = (v: unknown) => {
      const s =
        v === null || v === undefined
          ? ''
          : v instanceof Date
            ? v.toISOString()
            : typeof v === 'string' ||
                typeof v === 'number' ||
                typeof v === 'boolean'
              ? String(v)
              : JSON.stringify(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    for (const r of reviews) {
      rows.push(
        [
          r.id,
          escape(r.reviewerName),
          r.rating ?? '',
          escape(r.sentiment),
          escape(r.topic?.topicName),
          escape(r.reviewDate),
          r.likesCount ?? 0,
          escape(r.reviewText),
        ].join(','),
      );
    }

    // Membuat nama file dari slug destinasi.
    const slug = destination.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    const filename = `analytics_${slug}.csv`;

    return { csv: rows.join('\n'), filename };
  }

  // Menghitung ulang analytics satu destinasi.
  async recalculateAnalytics(destinationId: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, deletedAt: null },
      select: { id: true, name: true, googleRating: true },
    });

    if (!destination) {
      throw new NotFoundException('Destinasi tidak ditemukan');
    }
    const sentimentReviews = await this.prisma.review.findMany({
      where: { destinationId, sentiment: { not: null } },
      select: { sentiment: true },
    });

    const totalSentimentReviews = sentimentReviews.length;
    let positiveRatio = 0;
    if (totalSentimentReviews > 0) {
      const positiveCount = sentimentReviews.filter(
        (r) => r.sentiment === 'positive',
      ).length;
      positiveRatio = positiveCount / totalSentimentReviews;
    }
    const userRatingAgg = await this.prisma.userReview.aggregate({
      where: { destinationId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const userRating =
      userRatingAgg._avg.rating ?? destination.googleRating ?? 0;
    const userReviewCount = userRatingAgg._count.rating;
    const normalizedRating = userRating / 5;
    const recommendationScore = normalizedRating * 0.5 + positiveRatio * 0.5;
    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        positiveRatio,
        recommendationScore,
        userRating: userRatingAgg._avg.rating ?? null,
        userReviewCount,
      },
    });
    const topicReviews = await this.prisma.review.findMany({
      where: { destinationId, topicId: { not: null } },
      select: { topicId: true },
    });
    const topicCounts: Record<number, number> = {};
    for (const r of topicReviews) {
      const tId = r.topicId as number;
      topicCounts[tId] = (topicCounts[tId] ?? 0) + 1;
    }
    for (const [topicIdStr, count] of Object.entries(topicCounts)) {
      const topicId = parseInt(topicIdStr, 10);
      await this.prisma.destinationTopic.upsert({
        where: { destinationId_topicId: { destinationId, topicId } },
        create: { destinationId, topicId, totalReviews: count },
        update: { totalReviews: count },
      });
    }
    const topicsCount = Object.keys(topicCounts).length;
    const allReviewsWithDate = await this.prisma.review.findMany({
      where: { destinationId, reviewDate: { not: null } },
      select: { reviewDate: true, sentiment: true },
    });

    const trendMap: Record<string, { pos: number; neg: number; neu: number }> =
      {};
    for (const r of allReviewsWithDate) {
      if (!r.reviewDate) continue;
      const d = r.reviewDate;
      const key = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
      if (!trendMap[key]) trendMap[key] = { pos: 0, neg: 0, neu: 0 };
      if (r.sentiment === 'positive') trendMap[key].pos++;
      else if (r.sentiment === 'negative') trendMap[key].neg++;
      else trendMap[key].neu++;
    }
    for (const [dateStr, counts] of Object.entries(trendMap)) {
      const date = new Date(dateStr);
      await this.prisma.sentimentTrend.upsert({
        where: { destinationId_date: { destinationId, date } },
        create: {
          destinationId,
          date,
          positiveCount: counts.pos,
          negativeCount: counts.neg,
          neutralCount: counts.neu,
        },
        update: {
          positiveCount: counts.pos,
          negativeCount: counts.neg,
          neutralCount: counts.neu,
        },
      });
    }
    const totalReviews = await this.prisma.review.count({
      where: { destinationId },
    });

    return {
      message: 'Analytics recalculated',
      destination_id: destinationId,
      positive_ratio: Math.round(positiveRatio * 1000) / 1000,
      recommendation_score: Math.round(recommendationScore * 1000) / 1000,
      total_reviews: totalReviews,
      topics_count: topicsCount,
    };
  }

  private buildSentimentDist(
    counts: Array<{ sentiment: string | null; _count: { sentiment: number } }>,
  ): { positive: number; negative: number; neutral: number } {
    const dist: { positive: number; negative: number; neutral: number } = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };
    for (const c of counts) {
      if (c.sentiment && c.sentiment in dist) {
        dist[c.sentiment as keyof typeof dist] = c._count.sentiment;
      }
    }
    return dist;
  }

  private getPeriodKey(
    date: Date,
    period: 'daily' | 'weekly' | 'monthly',
  ): string {
    const d = new Date(date); // Menyalin tanggal agar nilai asli tidak berubah.
    if (period === 'daily') {
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    if (period === 'weekly') {
      // Mengambil hari Senin pada minggu ISO.
      const day = d.getDay(); // 0=Sun, 1=Mon, ...
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      return monday.toISOString().slice(0, 10);
    }
    // Format bulanan.
    return d.toISOString().slice(0, 7); // YYYY-MM
  }

  private async getDestinationSnapshot(
    id: number,
  ): Promise<CompareDestinationSnapshot | null> {
    const dest = await this.prisma.destination.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        province: true,
        category: true,
        thumbnailUrl: true,
        latitude: true,
        longitude: true,
        googleMapsUrl: true,
        googleRating: true,
        userRating: true,
        positiveRatio: true,
        recommendationScore: true,
        destinationTopics: {
          include: {
            topic: {
              select: {
                topicName: true,
                group: { select: { groupName: true } },
              },
            },
          },
          orderBy: { totalReviews: 'desc' },
          take: 10,
        },
      },
    });

    if (!dest) return null;

    const [sentimentCounts, reviewCount] = await Promise.all([
      this.prisma.review.groupBy({
        by: ['sentiment'],
        _count: { sentiment: true },
        where: { destinationId: id, sentiment: { not: null } },
      }),
      this.prisma.review.count({ where: { destinationId: id } }),
    ]);

    const topics = dest.destinationTopics.map((t) => ({
      topic_name: t.topic.topicName,
      total_reviews: t.totalReviews,
      group_name: t.topic.group?.groupName ?? null,
    }));
    const sentiment = this.buildSentimentDist(sentimentCounts);
    const topicGroups = this.buildTopicGroups(topics);

    return {
      id: dest.id,
      name: dest.name,
      slug: dest.slug,
      city: dest.city,
      province: dest.province,
      category: dest.category,
      thumbnailUrl: dest.thumbnailUrl,
      latitude: dest.latitude,
      longitude: dest.longitude,
      googleMapsUrl: dest.googleMapsUrl,
      sentiment,
      topics: topics.slice(0, 5),
      top_topics: topics.slice(0, 5),
      topic_groups: topicGroups,
      rating: {
        google: dest.googleRating,
        user: dest.userRating,
      },
      recommendation_score: dest.recommendationScore,
      positive_ratio: dest.positiveRatio,
      review_count: reviewCount,
      travel_traits: this.buildTravelTraits(dest.category, topics),
      decision_factors: this.buildDecisionFactors(dest, topics, sentiment),
      highlights: this.pickTopicSignals(topics, 'highlight'),
      risks: this.pickTopicSignals(topics, 'risk'),
    };
  }

  private buildTopicGroups(topics: CompareTopicSignal[]) {
    const groups = new Map<string, number>();
    for (const topic of topics) {
      const groupName = topic.group_name || 'Topik lainnya';
      groups.set(groupName, (groups.get(groupName) ?? 0) + topic.total_reviews);
    }
    return Array.from(groups.entries())
      .map(([group_name, total_reviews]) => ({ group_name, total_reviews }))
      .sort((a, b) => b.total_reviews - a.total_reviews)
      .slice(0, 5);
  }

  private buildTravelTraits(
    category: string,
    topics: CompareTopicSignal[],
  ): Record<string, number> {
    const text = this.topicText(topics);
    return {
      family: this.scoreKeywords(text, category, [
        'keluarga',
        'anak',
        'edukasi',
        'aman',
        'nyaman',
      ]),
      couple: this.scoreKeywords(text, category, [
        'romantis',
        'tenang',
        'foto',
        'pemandangan',
        'sunset',
      ]),
      solo: this.scoreKeywords(text, category, [
        'tenang',
        'mudah',
        'aman',
        'murah',
        'akses',
      ]),
      photo_spot: this.scoreKeywords(text, category, [
        'foto',
        'spot',
        'pemandangan',
        'indah',
        'ikonik',
      ]),
      relaxing: this.scoreKeywords(text, category, [
        'tenang',
        'asri',
        'sejuk',
        'nyaman',
        'healing',
      ]),
      culture: this.scoreKeywords(text, category, [
        'budaya',
        'sejarah',
        'tradisi',
        'museum',
        'religi',
      ]),
      adventure: this.scoreKeywords(text, category, [
        'petualangan',
        'alam',
        'trekking',
        'air terjun',
        'akses susah',
      ]),
    };
  }

  private buildDecisionFactors(
    dest: {
      category: string;
      googleMapsUrl: string | null;
      latitude: number | null;
      longitude: number | null;
      positiveRatio: number | null;
      recommendationScore: number | null;
    },
    topics: CompareTopicSignal[],
    sentiment: { positive: number; neutral: number; negative: number },
  ): Record<CompareFactorKey, number> {
    const text = this.topicText(topics);
    const quality = Math.round(
      (dest.positiveRatio ?? 0.5) * 55 + (dest.recommendationScore ?? 0.5) * 45,
    );
    return {
      access: this.clampScore(
        48 +
          (dest.googleMapsUrl || (dest.latitude && dest.longitude) ? 12 : 0) +
          this.keywordDelta(text, ['akses mudah', 'jalan bagus', 'mudah'], 18) -
          this.keywordDelta(text, ['akses susah', 'jalan rusak', 'macet'], 22),
      ),
      cost_value: this.clampScore(
        quality +
          this.keywordDelta(text, ['murah', 'terjangkau', 'worth'], 12) -
          this.keywordDelta(text, ['mahal', 'pungli', 'biaya'], 22),
      ),
      cleanliness: this.clampScore(
        quality +
          this.keywordDelta(text, ['bersih', 'terawat', 'nyaman'], 15) -
          this.keywordDelta(text, ['kotor', 'tidak terawat', 'sampah'], 24),
      ),
      facilities: this.clampScore(
        50 +
          this.keywordDelta(
            text,
            ['toilet', 'parkir', 'mushola', 'warung'],
            22,
          ) -
          this.keywordDelta(text, ['fasilitas kurang', 'toilet kotor'], 16),
      ),
      crowd: this.clampScore(
        58 +
          this.keywordDelta(text, ['tenang', 'sepi', 'nyaman'], 18) -
          this.keywordDelta(text, ['ramai', 'padat', 'antri'], 20) -
          (sentiment.negative > sentiment.positive ? 8 : 0),
      ),
      view_activity: this.clampScore(
        quality +
          this.keywordDelta(
            text,
            ['pemandangan', 'foto', 'aktivitas', 'budaya', 'kuliner', 'pantai'],
            18,
          ),
      ),
    };
  }

  private pickTopicSignals(
    topics: CompareTopicSignal[],
    kind: 'highlight' | 'risk',
  ): string[] {
    const keywords =
      kind === 'highlight'
        ? [
            'indah',
            'bagus',
            'bersih',
            'nyaman',
            'murah',
            'mudah',
            'foto',
            'budaya',
            'asri',
            'tenang',
            'menarik',
            'lengkap',
          ]
        : [
            'mahal',
            'pungli',
            'kotor',
            'susah',
            'rusak',
            'ramai',
            'macet',
            'kurang',
            'tidak',
            'buruk',
            'parkir',
          ];
    const matched = topics
      .filter((topic) =>
        keywords.some((keyword) =>
          topic.topic_name.toLowerCase().includes(keyword),
        ),
      )
      .map((topic) => this.cleanTopicName(topic.topic_name))
      .filter(Boolean)
      .slice(0, 4);
    if (matched.length > 0) return [...new Set(matched)];
    return topics
      .map((topic) => this.cleanTopicName(topic.topic_name))
      .filter(Boolean)
      .slice(0, kind === 'highlight' ? 3 : 2);
  }

  private pickRecommendedDestination(
    dest1: CompareDestinationSnapshot,
    dest2: CompareDestinationSnapshot,
  ) {
    const score = (dest: CompareDestinationSnapshot) =>
      (dest.recommendation_score ?? 0) * 0.45 +
      (dest.positive_ratio ?? 0) * 0.3 +
      ((dest.rating.user ?? dest.rating.google ?? 0) / 5) * 0.15 +
      (dest.risks.length ? 0 : 0.1);
    return score(dest1) >= score(dest2) ? dest1 : dest2;
  }

  private buildCompareInsights(
    dest1: CompareDestinationSnapshot,
    dest2: CompareDestinationSnapshot,
    recommended: CompareDestinationSnapshot,
  ) {
    const other = recommended.id === dest1.id ? dest2 : dest1;
    const bestFor = Object.entries(recommended.travel_traits)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => this.traitLabel(key));
    return {
      recommended_destination_id: recommended.id,
      summary: `${recommended.name} lebih cocok dipilih jika Anda mengejar ${bestFor.join(', ').toLowerCase()}. ${other.name} tetap menarik sebagai pembanding, terutama jika faktor risikonya sesuai toleransi perjalanan Anda.`,
      best_for: bestFor,
      tradeoffs: [
        ...recommended.highlights
          .slice(0, 2)
          .map((item) => `${recommended.name}: ${item}`),
        ...other.risks
          .slice(0, 2)
          .map((item) => `${other.name}: perlu cek ${item.toLowerCase()}`),
      ].slice(0, 4),
      score_cards: [this.buildScoreCard(dest1), this.buildScoreCard(dest2)],
    };
  }

  private buildScoreCard(dest: CompareDestinationSnapshot) {
    const factorAverage =
      Object.values(dest.decision_factors).reduce(
        (sum, value) => sum + value,
        0,
      ) / Object.values(dest.decision_factors).length;
    return {
      destination_id: dest.id,
      label: dest.name,
      score: this.clampScore(
        (dest.recommendation_score ?? 0.5) * 45 +
          (dest.positive_ratio ?? 0.5) * 25 +
          factorAverage * 0.3,
      ),
      reasons: [...dest.highlights.slice(0, 2), ...dest.risks.slice(0, 1)],
    };
  }

  private topicText(topics: CompareTopicSignal[]) {
    return topics.map((topic) => topic.topic_name.toLowerCase()).join(' ');
  }

  private scoreKeywords(text: string, category: string, keywords: string[]) {
    const categoryHit = keywords.some((keyword) => category.includes(keyword))
      ? 18
      : 0;
    return this.clampScore(
      42 + categoryHit + this.keywordDelta(text, keywords, 18),
    );
  }

  private keywordDelta(text: string, keywords: string[], amount: number) {
    const hits = keywords.filter((keyword) => text.includes(keyword)).length;
    return Math.min(amount, hits * Math.ceil(amount / 2));
  }

  private clampScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private cleanTopicName(name: string) {
    return name.replace(/^Topic \d+:\s*/, '').trim();
  }

  private traitLabel(key: string) {
    const labels: Record<string, string> = {
      family: 'Keluarga',
      couple: 'Pasangan',
      solo: 'Solo traveler',
      photo_spot: 'Foto',
      relaxing: 'Santai',
      culture: 'Budaya',
      adventure: 'Petualangan',
    };
    return labels[key] ?? key;
  }
}
