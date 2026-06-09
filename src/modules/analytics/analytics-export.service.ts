import { Injectable } from '@nestjs/common';
import { findActiveDestinationIdentity } from '../../common/utils/destination-lookup.util';
import { PrismaService } from '../../prisma/prisma.service';

type AnalyticsExportReview = {
  id: number;
  reviewerName: string | null;
  rating: number | null;
  reviewText: string | null;
  sentiment: string | null;
  reviewDate: Date | null;
  likesCount: number | null;
  topic: { topicName: string } | null;
};

type CsvSerializer = (value: unknown) => string;

const CSV_SERIALIZERS: Record<string, CsvSerializer> = {
  string: (value) => value as string,
  number: (value) => (value as number).toString(),
  boolean: (value) => (value as boolean).toString(),
};

const JSON_SERIALIZER: CsvSerializer = (value) => JSON.stringify(value) ?? '';

@Injectable()
export class AnalyticsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exportDestination(
    destinationId: number,
  ): Promise<{ csv: string; filename: string }> {
    const destination = await this.findDestination(destinationId);
    const reviews = await this.findReviews(destinationId);
    const rows = this.buildRows(destination.name, reviews);
    const filename = `analytics_${this.toFileSlug(destination.name)}.csv`;

    return { csv: rows.join('\n'), filename };
  }

  private async findDestination(destinationId: number) {
    return findActiveDestinationIdentity(this.prisma, destinationId);
  }

  private findReviews(destinationId: number): Promise<AnalyticsExportReview[]> {
    return this.prisma.review.findMany({
      where: { destinationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reviewerName: true,
        rating: true,
        reviewText: true,
        sentiment: true,
        reviewDate: true,
        likesCount: true,
        topic: { select: { topicName: true } },
      },
    });
  }

  private buildRows(destinationName: string, reviews: AnalyticsExportReview[]) {
    return [
      ...this.buildHeader(destinationName, reviews),
      ...reviews.map((review) => this.toReviewRow(review)),
    ];
  }

  private buildHeader(
    destinationName: string,
    reviews: AnalyticsExportReview[],
  ) {
    const counts = this.countSentiments(reviews);

    return [
      `# Destination: ${destinationName}`,
      `# Total Reviews: ${reviews.length} | Positive: ${counts.positive} | Negative: ${counts.negative} | Neutral: ${counts.neutral}`,
      `# Exported at: ${new Date().toISOString()}`,
      'id,reviewer_name,rating,sentiment,topic,review_date,likes_count,review_text',
    ];
  }

  private countSentiments(reviews: AnalyticsExportReview[]) {
    return {
      positive: reviews.filter((review) => review.sentiment === 'positive')
        .length,
      negative: reviews.filter((review) => review.sentiment === 'negative')
        .length,
      neutral: reviews.filter((review) => review.sentiment === 'neutral')
        .length,
    };
  }

  private toReviewRow(review: AnalyticsExportReview) {
    return [
      review.id,
      this.escapeCsvValue(review.reviewerName),
      review.rating ?? '',
      this.escapeCsvValue(review.sentiment),
      this.escapeCsvValue(review.topic?.topicName),
      this.escapeCsvValue(review.reviewDate),
      review.likesCount ?? 0,
      this.escapeCsvValue(review.reviewText),
    ].join(',');
  }

  private toFileSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private escapeCsvValue(value: unknown) {
    return `"${this.toCsvString(value).replace(/"/g, '""')}"`;
  }

  private toCsvString(value: unknown) {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    return this.serializeCsvPrimitiveOrObject(value);
  }

  private serializeCsvPrimitiveOrObject(value: unknown) {
    const serializer = CSV_SERIALIZERS[typeof value] ?? JSON_SERIALIZER;
    return serializer(value);
  }
}
