import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ReviewProcessingPlan } from './nlp-upload.types';
import type { NlpProcessingMode } from './utils/nlp-dedup.util';

@Injectable()
export class NlpProcessingHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    destinationId?: string,
    status?: string,
    page = '1',
    limit = '10',
  ) {
    const currentPage = this.parsePositiveNumber(page, 1);
    const take = Math.min(this.parsePositiveNumber(limit, 10), 50);
    const where = {
      ...(destinationId ? { destinationId: parseInt(destinationId, 10) } : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.nlpProcessingRun.findMany({
        where,
        skip: (currentPage - 1) * take,
        take,
        orderBy: { startedAt: 'desc' },
        include: {
          destination: { select: { id: true, name: true, city: true } },
          admin: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.nlpProcessingRun.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: currentPage,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const runId = parseInt(id, 10);
    if (Number.isNaN(runId)) {
      throw new BadRequestException('id harus berupa angka');
    }

    const run = await this.prisma.nlpProcessingRun.findUnique({
      where: { id: runId },
      include: {
        destination: { select: { id: true, name: true, city: true } },
        admin: { select: { id: true, name: true, email: true } },
      },
    });
    if (!run) throw new NotFoundException('Riwayat proses NLP tidak ditemukan');
    return run;
  }

  async create(input: {
    destinationId: number;
    adminId?: number;
    fileName: string;
    fileHash: string;
    mode: NlpProcessingMode;
    totalRows: number;
  }) {
    const run = await this.prisma.nlpProcessingRun.create({
      data: {
        ...input,
        status: 'processing',
      },
      select: { id: true },
    });
    return run.id;
  }

  async markCompleted(runId: number, plan: ReviewProcessingPlan) {
    await this.prisma.nlpProcessingRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        insertedReviews: plan.insertedReviewIds.length,
        skippedDuplicates: plan.skippedDuplicates,
        processedReviews: plan.processReviews.length,
        finishedAt: new Date(),
      },
    });
  }

  async markFailed(runId: number, errorMessage: string, inserted: number) {
    await this.prisma.nlpProcessingRun.update({
      where: { id: runId },
      data: {
        status: 'failed',
        errorMessage,
        insertedReviews: inserted,
        finishedAt: new Date(),
      },
    });
  }

  private parsePositiveNumber(value: string, fallback: number) {
    return Math.max(parseInt(value, 10) || fallback, 1);
  }
}
