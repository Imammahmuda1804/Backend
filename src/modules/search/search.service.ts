import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NlpService } from '../nlp/nlp.service';
import { VectorService } from '../vector/vector.service';
import { NlpServiceUnavailableException } from '../nlp/exceptions/nlp-unavailable.exception';
import { SearchQueryDto } from './dto';

@Injectable()
// Mengelola semantic search dan riwayat pencarian pengguna.
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nlpService: NlpService,
    private readonly vectorService: VectorService,
  ) {}

  // Menjalankan search semantik, menambahkan topik, lalu menyimpan riwayat user.
  async semanticSearch(dto: SearchQueryDto, userId?: number) {
    const limit = Math.min(dto.limit ?? 10, 50);

    this.logger.log(
      `Search request: "${dto.query}" by user ${userId || 'guest'}`,
    );

    const embedding = await this.getSearchEmbedding(dto.query);
    const results = await this.vectorService.hybridSearch(
      embedding,
      limit,
      dto.sort,
      this.buildSearchFilters(dto),
    );
    const enrichedResults = await this.attachTopTopics(results);

    await this.saveSearchHistory(dto.query, userId);

    this.logger.log(
      `Semantic search: "${dto.query}" -> ${results.length} results` +
        (userId ? ` (user ${userId})` : ' (guest)'),
    );

    return enrichedResults;
  }

  private async getSearchEmbedding(query: string): Promise<number[]> {
    try {
      return await this.nlpService.embedQuery(query);
    } catch (error) {
      if (error instanceof NlpServiceUnavailableException) {
        throw new ServiceUnavailableException(
          'NLP service sedang tidak tersedia, coba beberapa saat lagi',
        );
      }
      throw error;
    }
  }

  private buildSearchFilters(dto: SearchQueryDto) {
    return {
      city: dto.city,
      category: dto.category,
      topicIds: dto.topicIds ?? dto.topic_ids,
      minRating: dto.minRating ?? dto.min_rating,
      sentiment: dto.sentiment,
    };
  }

  private async saveSearchHistory(query: string, userId?: number) {
    if (!userId) {
      this.logger.log('No userId provided - search history not saved');
      return;
    }

    try {
      await this.prisma.searchLog.create({
        data: { userId, keyword: query },
      });
      this.logger.log(`Search history saved for user ${userId}: "${query}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to save search log for user ${userId}: ${message}`,
      );
    }
  }

  // Menambahkan tiga topik dominan pada setiap hasil destinasi.
  private async attachTopTopics<T extends { id: number }>(results: T[]) {
    if (results.length === 0) return results;

    const destinations = await this.prisma.destination.findMany({
      where: { id: { in: results.map((result) => result.id) } },
      select: {
        id: true,
        destinationTopics: {
          orderBy: { totalReviews: 'desc' },
          take: 3,
          select: {
            totalReviews: true,
            topic: {
              select: {
                id: true,
                topicName: true,
              },
            },
          },
        },
      },
    });

    const topicMap = new Map(
      destinations.map((destination) => [
        destination.id,
        destination.destinationTopics.map((item) => ({
          id: item.topic.id,
          name: item.topic.topicName,
          topic_name: item.topic.topicName,
          total_reviews: item.totalReviews,
        })),
      ]),
    );

    return results.map((result) => ({
      ...result,
      topics: topicMap.get(result.id) ?? [],
    }));
  }

  // Mengambil riwayat pencarian user.
  async getHistory(userId: number, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.searchLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          keyword: true,
          createdAt: true,
        },
      }),
      this.prisma.searchLog.count({ where: { userId } }),
    ]);

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

  // Menghapus semua riwayat pencarian user.
  async clearHistory(userId: number) {
    const { count } = await this.prisma.searchLog.deleteMany({
      where: { userId },
    });

    return {
      message: 'Search history cleared',
      deleted_count: count,
    };
  }

  // Menghapus satu riwayat pencarian user.
  async deleteHistoryEntry(entryId: number, userId: number) {
    const entry = await this.prisma.searchLog.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      throw new NotFoundException('Riwayat pencarian tidak ditemukan');
    }

    if (entry.userId !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses ke riwayat pencarian ini',
      );
    }

    await this.prisma.searchLog.delete({ where: { id: entryId } });

    return { message: 'Search history entry deleted' };
  }
}
