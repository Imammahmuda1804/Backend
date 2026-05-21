import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VectorService } from '../vector/vector.service';
import { AiNamingService } from './ai-naming.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
import {
  averageAndNormalizeEmbeddings,
  mapPipelineSentiment,
} from './utils/nlp-result.util';

@Injectable()
// Menyimpan hasil NLP dari FastAPI ke tabel review, topic, embedding, dan analitik destinasi.
export class NlpResultStorageService {
  private readonly logger = new Logger(NlpResultStorageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly vectorService: VectorService,
    private readonly aiNamingService: AiNamingService,
  ) {}

  async saveNlpResults(
    destinationId: number,
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
  ): Promise<void> {
    this.logPipelineResult(destinationId, nlpResult);

    const savedTopicIds = await this.saveTopics(nlpResult);
    await this.updateReviews(nlpResult, reviewIds, savedTopicIds);
    await this.saveReviewEmbeddings(nlpResult, reviewIds);
    await this.saveDestinationEmbedding(destinationId, nlpResult);

    await this.calculateRecommendationScore(destinationId);
    await this.updateDestinationTopics(destinationId);
    await this.updateSentimentTrends(destinationId);
  }

  // Mencatat ringkasan pipeline agar proses NLP mudah ditelusuri.
  private logPipelineResult(
    destinationId: number,
    nlpResult: NlpPipelineResult,
  ): void {
    this.logger.log(
      `NLP result summary for destination ${destinationId}: ${JSON.stringify(
        nlpResult.summary,
      )}`,
    );

    if (nlpResult.new_topics && nlpResult.new_topics.length > 0) {
      this.logger.log(
        `${nlpResult.new_topics.length} new topics discovered by NLP pipeline`,
      );
    }

    if (nlpResult.warning) {
      this.logger.warn(`Pipeline warning: ${nlpResult.warning}`);
    }

    if (nlpResult.metadata) {
      this.logger.log(
        `NLP model metadata: ${JSON.stringify(nlpResult.metadata)}`,
      );
    }
  }

  // Membuat atau memperbarui topik dari hasil pipeline.
  private async saveTopics(nlpResult: NlpPipelineResult): Promise<Set<number>> {
    const savedTopicIds = new Set<number>();
    const topicGroups = await this.prisma.topicGroup.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true, groupName: true, keywords: true },
    });
    const groupCandidates = topicGroups.map((group) => ({
      id: group.id,
      groupName: group.groupName,
      keywords: Array.isArray(group.keywords)
        ? (group.keywords as string[])
        : [],
    }));

    if (!Array.isArray(nlpResult.topics)) return savedTopicIds;

    for (const topic of nlpResult.topics) {
      if (!topic.topic_id && topic.topic_id !== 0) {
        this.logger.warn(
          `Skipping topic with no topic_id: ${JSON.stringify(topic)}`,
        );
        continue;
      }

      const topicId = topic.topic_id;
      const keywords = Array.isArray(topic.keywords) ? topic.keywords : [];
      const representativeDocs = topic.representative_docs ?? [];
      const existingTopic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });

      let topicName = existingTopic?.topicName;
      if (!existingTopic) {
        this.logger.log(`Generating AI name for new topic ${topicId}`);
        topicName = await this.aiNamingService.generateTopicName(
          topicId,
          keywords,
          representativeDocs,
        );
      } else {
        topicName =
          topicName || `Topic ${topicId}: ${keywords.slice(0, 3).join(', ')}`;
      }

      const groupId =
        existingTopic?.groupId ??
        this.aiNamingService.classifyTopicGroup(
          topicName,
          keywords,
          representativeDocs,
          groupCandidates,
        );

      await this.prisma.topic.upsert({
        where: { id: topicId },
        create: {
          id: topicId,
          topicName,
          keywords,
          groupId,
        },
        update: {
          keywords,
          ...(existingTopic?.groupId ? {} : { groupId }),
        },
      });
      savedTopicIds.add(topicId);
    }

    return savedTopicIds;
  }

  // Memperbarui review dengan teks bersih, sentimen, confidence, dan topik.
  private async updateReviews(
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
    savedTopicIds: Set<number>,
  ): Promise<void> {
    if (!Array.isArray(nlpResult.results)) return;

    for (let index = 0; index < nlpResult.results.length; index++) {
      const review = nlpResult.results[index];
      const realReviewId = review.review_id ?? reviewIds[index];
      if (!realReviewId) continue;

      const safeTopicId =
        review.topic_id != null && savedTopicIds.has(review.topic_id)
          ? review.topic_id
          : null;

      await this.prisma.review.update({
        where: { id: realReviewId },
        data: {
          cleanedText: review.cleaned_text,
          sentiment: mapPipelineSentiment(review.sentiment),
          sentimentConfidence: review.sentiment_confidence,
          topicId: safeTopicId,
        },
      });
    }
  }

  // Menyimpan embedding setiap review ke tabel pgvector.
  private async saveReviewEmbeddings(
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
  ): Promise<void> {
    const embeddingsToInsert = (nlpResult.results || [])
      .filter((result) => result.embedding && result.embedding.length > 0)
      .map((result, index) => ({
        reviewId: result.review_id ?? reviewIds[index],
        embedding: result.embedding,
      }))
      .filter((item): item is { reviewId: number; embedding: number[] } =>
        Boolean(item.reviewId),
      );

    if (embeddingsToInsert.length > 0) {
      await this.vectorService.batchInsertReviewEmbeddings(embeddingsToInsert);
    }
  }

  // Membuat embedding destinasi dari rata-rata embedding review.
  private async saveDestinationEmbedding(
    destinationId: number,
    nlpResult: NlpPipelineResult,
  ): Promise<void> {
    const validEmbeddings = (nlpResult.results || [])
      .map((result) => result.embedding)
      .filter((embedding) => embedding && embedding.length > 0);

    const destinationEmbedding = averageAndNormalizeEmbeddings(validEmbeddings);

    if (destinationEmbedding) {
      await this.vectorService.upsertDestinationEmbedding(
        destinationId,
        destinationEmbedding,
      );
    }
  }

  // Menghitung skor rekomendasi dari rating dan rasio sentimen positif.
  private async calculateRecommendationScore(destinationId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { destinationId, sentiment: { not: null } },
      select: { sentiment: true },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) return;

    const positiveCount = reviews.filter(
      (review) => review.sentiment === 'positive',
    ).length;
    const positiveRatio = positiveCount / totalReviews;

    const dest = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { userRating: true, googleRating: true },
    });

    const userRating = dest?.userRating ?? dest?.googleRating ?? 0;
    const recommendationScore = (userRating / 5) * 0.5 + positiveRatio * 0.5;

    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        positiveRatio,
        recommendationScore,
      },
    });
  }

  // Menghitung jumlah review per topik untuk satu destinasi.
  private async updateDestinationTopics(destinationId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { destinationId, topicId: { not: null } },
      select: { topicId: true },
    });

    const topicCounts: Record<number, number> = {};
    for (const review of reviews) {
      const topicId = review.topicId as number;
      topicCounts[topicId] = (topicCounts[topicId] || 0) + 1;
    }

    for (const [topicIdStr, count] of Object.entries(topicCounts)) {
      const topicId = Number(topicIdStr);
      await this.prisma.destinationTopic.upsert({
        where: {
          destinationId_topicId: {
            destinationId,
            topicId,
          },
        },
        create: {
          destinationId,
          topicId,
          totalReviews: count,
        },
        update: {
          totalReviews: count,
        },
      });
    }
  }

  // Menghitung tren sentimen bulanan dari tanggal review.
  private async updateSentimentTrends(destinationId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { destinationId, reviewDate: { not: null } },
      select: { reviewDate: true, sentiment: true },
    });

    const trends: Record<string, { pos: number; neg: number; neu: number }> =
      {};

    for (const review of reviews) {
      if (!review.reviewDate) continue;

      const dateStr = new Date(
        review.reviewDate.getFullYear(),
        review.reviewDate.getMonth(),
        1,
      ).toISOString();

      trends[dateStr] ??= { pos: 0, neg: 0, neu: 0 };

      if (review.sentiment === 'positive') trends[dateStr].pos++;
      else if (review.sentiment === 'negative') trends[dateStr].neg++;
      else trends[dateStr].neu++;
    }

    for (const [dateStr, counts] of Object.entries(trends)) {
      const date = new Date(dateStr);
      await this.prisma.sentimentTrend.upsert({
        where: {
          destinationId_date: {
            destinationId,
            date,
          },
        },
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
  }
}
