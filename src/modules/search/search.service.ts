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
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly nlpService: NlpService,
        private readonly vectorService: VectorService,
    ) { }

    /**
     * Semantic search utama
     * 1. Embed query via FastAPI
     * 2. Hybrid search di pgvector
     * 3. Simpan ke search_logs jika user login
     */
    async semanticSearch(dto: SearchQueryDto, userId?: number) {
        const limit = Math.min(dto.limit ?? 10, 50);

        // Log untuk debugging
        this.logger.log(`Search request: "${dto.query}" by user ${userId || 'guest'}`);

        // 1. Get embedding dari FastAPI — propagate 503 jika service down
        let embedding: number[];
        try {
            embedding = await this.nlpService.embedQuery(dto.query);
        } catch (error) {
            if (error instanceof NlpServiceUnavailableException) {
                throw new ServiceUnavailableException(
                    'NLP service sedang tidak tersedia, coba beberapa saat lagi',
                );
            }
            throw error;
        }

        // 2. Hybrid search di pgvector
        const results = await this.vectorService.hybridSearch(embedding, limit);

        // 3. Simpan search log jika user login
        if (userId) {
            try {
                await this.prisma.searchLog.create({
                    data: { userId, keyword: dto.query }
                });
                this.logger.log(`✅ Search history saved for user ${userId}: "${dto.query}"`);
            } catch (err) {
                this.logger.error(`❌ Failed to save search log for user ${userId}: ${err.message}`);
            }
        } else {
            this.logger.log(`ℹ️ No userId provided - search history not saved`);
        }

        this.logger.log(
            `Semantic search: "${dto.query}" → ${results.length} results` +
            (userId ? ` (user ${userId})` : ' (guest)'),
        );

        return results;
    }

    /**
     * GET /search/history — riwayat pencarian user (paginated)
     */
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

    /**
     * DELETE /search/history — hapus semua riwayat user
     */
    async clearHistory(userId: number) {
        const { count } = await this.prisma.searchLog.deleteMany({
            where: { userId },
        });

        return {
            message: 'Search history cleared',
            deleted_count: count,
        };
    }

    /**
     * DELETE /search/history/:id — hapus satu entry (validasi ownership)
     */
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
