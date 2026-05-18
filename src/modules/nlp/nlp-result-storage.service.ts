import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VectorService } from '../vector/vector.service';
import { AiNamingService } from './ai-naming.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';

@Injectable()
export class NlpResultStorageService {
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
    // Log untuk debugging
    console.log(
      '📊 NLP Result Summary:',
      JSON.stringify(nlpResult.summary, null, 2),
    );
    console.log(
      '📊 NLP Result Topics:',
      JSON.stringify(nlpResult.topics?.slice(0, 3), null, 2),
    );
    console.log(
      '📊 NLP Result Results (first 2):',
      JSON.stringify(nlpResult.results?.slice(0, 2), null, 2),
    );

    // Log topik baru yang ditemukan oleh BIRCH clustering
    if (nlpResult.new_topics && nlpResult.new_topics.length > 0) {
      console.log(
        `🆕 ${nlpResult.new_topics.length} new topics discovered by BIRCH clustering!`,
      );
      console.log(
        '🆕 New Topics:',
        JSON.stringify(nlpResult.new_topics, null, 2),
      );
    }

    // Log warning jika ada graceful degradation
    if (nlpResult.warning) {
      console.warn('⚠️ Pipeline Warning:', nlpResult.warning);
    }

    // Helper function untuk map sentiment Indonesia ke English
    const mapSentiment = (sentiment: string): string => {
      const sentimentMap: Record<string, string> = {
        positif: 'positive',
        negatif: 'negative',
        netral: 'neutral',
      };
      return sentimentMap[sentiment.toLowerCase()] || sentiment;
    };

    // 1. Save/Update Topics — track which IDs were actually persisted
    const savedTopicIds = new Set<number>();
    if (nlpResult.topics && Array.isArray(nlpResult.topics)) {
      for (const topic of nlpResult.topics) {
        // Skip jika topic tidak memiliki topic_id yang valid (0 is falsy)
        if (!topic.topic_id && topic.topic_id !== 0) {
          console.warn('⚠️ Skipping topic with no topic_id:', topic);
          continue;
        }

        const topicId = topic.topic_id;

        // Cek apakah topik sudah ada di DB
        const existingTopic = await this.prisma.topic.findUnique({
          where: { id: topicId },
        });

        let topicName = existingTopic?.topicName;

        if (!existingTopic) {
          // Jika topik baru, gunakan AI untuk generate nama
          console.log(`🤖 Generating AI name for new topic ${topicId}...`);
          topicName = await this.aiNamingService.generateTopicName(
            topicId,
            topic.keywords,
          );
        } else {
          // Fallback kalau nama topik kosong di db
          topicName =
            topicName ||
            `Topic ${topicId}: ${topic.keywords.slice(0, 3).join(', ')}`;
        }

        await this.prisma.topic.upsert({
          where: { id: topicId },
          create: {
            id: topicId,
            topicName: topicName,
            keywords: topic.keywords,
          },
          update: {
            // Kita tidak mengupdate topicName jika sudah ada, agar nama dari AI tetap tersimpan
            keywords: topic.keywords,
          },
        });
        savedTopicIds.add(topicId);
      }
    }

    // 2. Update Reviews — only assign topicId if it was actually saved to DB
    if (nlpResult.results && Array.isArray(nlpResult.results)) {
      for (let index = 0; index < nlpResult.results.length; index++) {
        const review = nlpResult.results[index];
        const realReviewId = review.review_id ?? reviewIds[index];

        // Map sentiment dari Indonesia ke English
        const mappedSentiment = mapSentiment(review.sentiment);

        // Nullify topic_id if the topic wasn't persisted (prevents FK violation)
        const safeTopicId =
          review.topic_id != null && savedTopicIds.has(review.topic_id)
            ? review.topic_id
            : null;

        await this.prisma.review.update({
          where: { id: realReviewId },
          data: {
            cleanedText: review.cleaned_text,
            sentiment: mappedSentiment,
            topicId: safeTopicId,
          },
        });
      }
    }

    // 3. Save Review Embeddings
    const embeddingsToInsert = (nlpResult.results || [])
      .filter((r) => r.embedding && r.embedding.length > 0)
      .map((r, index) => ({
        reviewId: r.review_id ?? reviewIds[index],
        embedding: r.embedding,
      }));
    if (embeddingsToInsert.length > 0) {
      await this.vectorService.batchInsertReviewEmbeddings(embeddingsToInsert);
    }

    // 4. Calculate and Save Destination Embedding (average of all review embeddings)
    if (nlpResult.results && nlpResult.results.length > 0) {
      const validEmbeddings = nlpResult.results.reduce<number[][]>(
        (acc, result) => {
          if (result.embedding.length > 0) {
            acc.push(result.embedding);
          }
          return acc;
        },
        [],
      );

      if (validEmbeddings.length > 0) {
        const embeddingDim = validEmbeddings[0].length;
        const destinationEmbedding: number[] = Array.from(
          { length: embeddingDim },
          () => 0,
        );

        // Calculate average
        for (const embedding of validEmbeddings) {
          for (let i = 0; i < embeddingDim; i++) {
            destinationEmbedding[i] =
              (destinationEmbedding[i] ?? 0) + (embedding[i] ?? 0);
          }
        }

        for (let i = 0; i < embeddingDim; i++) {
          destinationEmbedding[i] /= validEmbeddings.length;
        }

        await this.vectorService.upsertDestinationEmbedding(
          destinationId,
          destinationEmbedding,
        );
      }
    }

    // 5. Update Destination Analytics
    await this.calculateRecommendationScore(destinationId);

    // 6. Update Destination Topics
    await this.updateDestinationTopics(destinationId);

    // 7. Update Sentiment Trends
    await this.updateSentimentTrends(destinationId);
  }

  private async calculateRecommendationScore(destinationId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { destinationId, sentiment: { not: null } },
      select: { sentiment: true },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) return;

    const positiveCount = reviews.filter(
      (r) => r.sentiment === 'positive',
    ).length;
    const positiveRatio = positiveCount / totalReviews;

    const dest = await this.prisma.destination.findUnique({
      where: { id: destinationId },
      select: { userRating: true, googleRating: true },
    });

    const userRating = dest?.userRating ?? dest?.googleRating ?? 0;

    const ratingWeight = 0.5;
    const sentimentWeight = 0.5;
    const normalizedRating = userRating / 5;
    const recommendationScore =
      normalizedRating * ratingWeight + positiveRatio * sentimentWeight;

    await this.prisma.destination.update({
      where: { id: destinationId },
      data: {
        positiveRatio,
        recommendationScore,
      },
    });
  }

  private async updateDestinationTopics(destinationId: number) {
    const reviews = await this.prisma.review.findMany({
      where: { destinationId, topicId: { not: null } },
      select: { topicId: true },
    });

    const topicCounts: Record<number, number> = {};
    for (const r of reviews) {
      const tId = r.topicId as number;
      topicCounts[tId] = (topicCounts[tId] || 0) + 1;
    }

    for (const [topicIdStr, count] of Object.entries(topicCounts)) {
      const topicId = parseInt(topicIdStr, 10);
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

  private async updateSentimentTrends(destinationId: number) {
    // Simple logic: group by year-month
    const reviews = await this.prisma.review.findMany({
      where: { destinationId, reviewDate: { not: null } },
      select: { reviewDate: true, sentiment: true },
    });

    const trends: Record<string, { pos: number; neg: number; neu: number }> =
      {};

    for (const r of reviews) {
      if (!r.reviewDate) continue;
      // Group by first day of the month
      const dateStr = new Date(
        r.reviewDate.getFullYear(),
        r.reviewDate.getMonth(),
        1,
      ).toISOString();
      if (!trends[dateStr]) {
        trends[dateStr] = { pos: 0, neg: 0, neu: 0 };
      }

      if (r.sentiment === 'positive') trends[dateStr].pos++;
      else if (r.sentiment === 'negative') trends[dateStr].neg++;
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
