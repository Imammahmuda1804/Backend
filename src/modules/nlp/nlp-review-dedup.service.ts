import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExcelParserUtil } from './utils/excel-parser.util';
import { NlpProcessingMode } from './utils/nlp-dedup.util';
import {
  ProcessReview,
  ReviewProcessingPlan,
  ReviewWithHash,
} from './nlp-upload.types';

type DedupPlanState = {
  destinationId: number;
  mode: NlpProcessingMode;
  knownReviewIds: Map<string, number>;
  seenUploadHashes: Set<string>;
  processReviews: ProcessReview[];
  insertedReviewIds: number[];
};

@Injectable()
// Menentukan review mana yang baru, duplikat, atau perlu diproses ulang.
export class NlpReviewDedupService {
  constructor(private readonly prisma: PrismaService) {}

  async getExistingReviewHashes(
    destinationId: number,
    reviews: ReviewWithHash[],
  ) {
    const existing = await this.loadExistingReviews(destinationId, reviews);
    return new Set(
      existing
        .map((review) => review.reviewHash)
        .filter((reviewHash): reviewHash is string => Boolean(reviewHash)),
    );
  }

  countDuplicateRows(reviews: ReviewWithHash[], existingHashes: Set<string>) {
    const seenUploadHashes = new Set<string>();
    let duplicateRows = 0;

    for (const review of reviews) {
      const alreadySeen = seenUploadHashes.has(review.reviewHash);
      const alreadyStored = existingHashes.has(review.reviewHash);
      if (alreadySeen || alreadyStored) {
        duplicateRows += 1;
        continue;
      }
      seenUploadHashes.add(review.reviewHash);
    }

    return duplicateRows;
  }

  async prepareReviewProcessingPlan(
    destinationId: number,
    mode: NlpProcessingMode,
    reviews: ReviewWithHash[],
    insertedReviewIds: number[],
  ): Promise<ReviewProcessingPlan> {
    const state = await this.createPlanState(
      destinationId,
      mode,
      reviews,
      insertedReviewIds,
    );
    let skippedDuplicates = 0;

    for (const review of reviews) {
      skippedDuplicates += await this.addReviewToPlan(review, state);
    }

    return {
      processReviews: state.processReviews,
      insertedReviewIds,
      skippedDuplicates,
    };
  }

  private async createPlanState(
    destinationId: number,
    mode: NlpProcessingMode,
    reviews: ReviewWithHash[],
    insertedReviewIds: number[],
  ): Promise<DedupPlanState> {
    return {
      destinationId,
      mode,
      knownReviewIds: await this.getKnownReviewIds(
        destinationId,
        mode,
        reviews,
      ),
      seenUploadHashes: new Set<string>(),
      processReviews: [],
      insertedReviewIds,
    };
  }

  private async getKnownReviewIds(
    destinationId: number,
    mode: NlpProcessingMode,
    reviews: ReviewWithHash[],
  ) {
    if (mode === 'replace_existing') return new Map<string, number>();
    return this.getExistingReviewMap(destinationId, reviews);
  }

  private async addReviewToPlan(review: ReviewWithHash, state: DedupPlanState) {
    if (this.isDuplicateInUpload(review, state.seenUploadHashes)) return 1;

    const existingId = state.knownReviewIds.get(review.reviewHash);
    if (existingId) return this.addExistingReview(review, existingId, state);

    return this.addNewReview(review, state);
  }

  private isDuplicateInUpload(
    review: ReviewWithHash,
    seenUploadHashes: Set<string>,
  ) {
    if (seenUploadHashes.has(review.reviewHash)) return true;
    seenUploadHashes.add(review.reviewHash);
    return false;
  }

  private addExistingReview(
    review: ReviewWithHash,
    existingId: number,
    state: DedupPlanState,
  ) {
    if (state.mode !== 'reprocess_existing') return 1;
    state.processReviews.push({ ...review, id: existingId });
    return 0;
  }

  private async addNewReview(review: ReviewWithHash, state: DedupPlanState) {
    const created = await this.createReviewOrRecoverDuplicate(
      state.destinationId,
      review,
      state.mode,
    );
    if (!created) return 1;

    state.knownReviewIds.set(review.reviewHash, created.id);
    if (created.inserted) state.insertedReviewIds.push(created.id);
    state.processReviews.push({ ...review, id: created.id });
    return 0;
  }

  private async getExistingReviewMap(
    destinationId: number,
    reviews: ReviewWithHash[],
  ) {
    const existing = await this.loadExistingReviews(destinationId, reviews);
    return new Map(
      existing
        .filter((review) => review.reviewHash)
        .map((review) => [review.reviewHash as string, review.id]),
    );
  }

  private async loadExistingReviews(
    destinationId: number,
    reviews: ReviewWithHash[],
  ) {
    return this.prisma.review.findMany({
      where: {
        destinationId,
        source: 'google_maps',
        reviewHash: { in: reviews.map((review) => review.reviewHash) },
      },
      select: { id: true, reviewHash: true },
    });
  }

  private async createReviewOrRecoverDuplicate(
    destinationId: number,
    review: ReviewWithHash,
    mode: NlpProcessingMode,
  ) {
    try {
      return await this.createReviewRecord(destinationId, review);
    } catch (error: unknown) {
      if (!this.isUniqueConstraintError(error)) throw error;
      return this.recoverDuplicateReview(destinationId, review, mode);
    }
  }

  private async createReviewRecord(
    destinationId: number,
    review: ReviewWithHash,
  ) {
    const created = await this.prisma.review.create({
      data: this.buildReviewCreateData(destinationId, review),
      select: { id: true },
    });

    return { id: created.id, inserted: true };
  }

  private buildReviewCreateData(destinationId: number, review: ReviewWithHash) {
    return {
      destinationId,
      reviewerName: this.defaultReviewerName(review.reviewerName),
      reviewText: this.nullWhenEmpty(review.reviewText),
      rating: this.nullWhenMissing(review.rating),
      reviewDate: ExcelParserUtil.parseIndonesianDate(review.reviewDate),
      source: 'google_maps',
      reviewHash: review.reviewHash,
      likesCount: this.zeroWhenMissing(review.likesCount),
      ownerReply: this.nullWhenEmpty(review.ownerReply),
    };
  }

  private defaultReviewerName(name?: string | null) {
    return this.nullWhenEmpty(name) ?? 'Anonymous';
  }

  private nullWhenEmpty(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private nullWhenMissing(value?: number | null) {
    return value ?? null;
  }

  private zeroWhenMissing(value?: number | null) {
    return value ?? 0;
  }

  private async recoverDuplicateReview(
    destinationId: number,
    review: ReviewWithHash,
    mode: NlpProcessingMode,
  ) {
    const existing = await this.prisma.review.findFirst({
      where: {
        destinationId,
        source: 'google_maps',
        reviewHash: review.reviewHash,
      },
      select: { id: true },
    });

    return existing && mode === 'reprocess_existing'
      ? { id: existing.id, inserted: false }
      : null;
  }

  private isUniqueConstraintError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      this.hasPrismaUniqueCode(error),
      message.includes('Unique constraint failed'),
      this.hasReviewHashConstraint(message),
    ].some(Boolean);
  }

  private hasPrismaUniqueCode(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private hasReviewHashConstraint(message: string) {
    return (
      message.includes('destination_id') && message.includes('review_hash')
    );
  }
}
