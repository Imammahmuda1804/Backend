import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiNamingService } from '../nlp/ai-naming.service';

@Injectable()
export class TopicsService {
    private readonly logger = new Logger(TopicsService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly aiNamingService: AiNamingService,
    ) { }

    /**
     * POST /admin/topics/rename-ai
     * Me-rename semua topik yang masih menggunakan nama keyword-based
     * (format "Topic X: ...") menjadi nama informatif via Gemini AI.
     * Bisa dijalankan kapan saja saat quota Gemini tersedia.
     */
    async renameUnnamedTopics(): Promise<{ renamed: number; failed: number; total: number }> {
        // Cari topik yang masih pakai nama keyword-based (dimulai dengan "Topic ")
        const topics = await this.prisma.topic.findMany({
            where: {
                topicName: { startsWith: 'Topic ' },
            },
            select: { id: true, topicName: true, keywords: true },
        });

        this.logger.log(`Found ${topics.length} topics to rename with AI`);

        let renamed = 0;
        let failed = 0;

        for (const topic of topics) {
            const keywords = Array.isArray(topic.keywords)
                ? topic.keywords as string[]
                : [];

            if (keywords.length === 0) {
                failed++;
                continue;
            }

            const newName = await this.aiNamingService.generateTopicName(topic.id, keywords);

            // Cek apakah AI berhasil memberikan nama baru (bukan fallback keyword-based)
            if (!newName.startsWith('Topic ')) {
                await this.prisma.topic.update({
                    where: { id: topic.id },
                    data: { topicName: newName },
                });
                this.logger.log(`Renamed topic ${topic.id}: "${topic.topicName}" → "${newName}"`);
                renamed++;
            } else {
                failed++;
            }
        }

        this.logger.log(`Rename complete: ${renamed} renamed, ${failed} failed, ${topics.length} total`);
        return { renamed, failed, total: topics.length };
    }

    /**
     * GET /topics
     * List semua topics dengan jumlah destinasi terkait.
     */
    async findAll() {
        const topics = await this.prisma.topic.findMany({
            orderBy: { id: 'asc' },
            select: {
                id: true,
                topicName: true,
                keywords: true,
                _count: {
                    select: { destinationTopics: true },
                },
            },
        });

        return topics.map((t) => ({
            id: t.id,
            topic_name: t.topicName,
            keywords: t.keywords,
            total_destinations: t._count.destinationTopics,
        }));
    }

    /**
     * GET /topics/:id/destinations
     * Paginated destinations yang memiliki topic tertentu.
     */
    async findDestinationsByTopic(
        topicId: number,
        page: number,
        limit: number,
    ) {
        // Cek topic exists
        const topic = await this.prisma.topic.findUnique({
            where: { id: topicId },
            select: { id: true, topicName: true },
        });

        if (!topic) {
            throw new NotFoundException('Topic tidak ditemukan');
        }

        const skip = (page - 1) * limit;

        const [destTopics, total] = await Promise.all([
            this.prisma.destinationTopic.findMany({
                where: {
                    topicId,
                    destination: { deletedAt: null },
                },
                skip,
                take: limit,
                orderBy: { totalReviews: 'desc' },
                select: {
                    totalReviews: true,
                    destination: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            city: true,
                            province: true,
                            thumbnailUrl: true,
                            positiveRatio: true,
                            recommendationScore: true,
                        },
                    },
                },
            }),
            this.prisma.destinationTopic.count({
                where: {
                    topicId,
                    destination: { deletedAt: null },
                },
            }),
        ]);

        const data = destTopics.map((dt) => ({
            ...dt.destination,
            total_reviews_in_topic: dt.totalReviews,
        }));

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
     * PUT /topics/:id/rename
     * Rename topik secara manual oleh admin.
     */
    async renameTopic(topicId: number, newName: string): Promise<{ id: number; topicName: string }> {
        const topic = await this.prisma.topic.findUnique({ where: { id: topicId } });
        if (!topic) throw new NotFoundException('Topic tidak ditemukan');

        const updated = await this.prisma.topic.update({
            where: { id: topicId },
            data: { topicName: newName },
            select: { id: true, topicName: true },
        });
        this.logger.log(`Topic ${topicId} renamed to "${newName}"`);
        return updated;
    }

    /**
     * DELETE /topics/:id
     * Hapus topik beserta relasi destinationTopic dan unlink review.
     */
    async deleteTopic(topicId: number): Promise<{ deleted: boolean; id: number }> {
        const topic = await this.prisma.topic.findUnique({ where: { id: topicId } });
        if (!topic) throw new NotFoundException('Topic tidak ditemukan');

        // Hapus relasi terlebih dahulu, lalu topik
        await this.prisma.$transaction([
            this.prisma.destinationTopic.deleteMany({ where: { topicId } }),
            this.prisma.review.updateMany({ where: { topicId }, data: { topicId: null } }),
            this.prisma.topic.delete({ where: { id: topicId } }),
        ]);

        this.logger.log(`Topic ${topicId} ("${topic.topicName}") deleted`);
        return { deleted: true, id: topicId };
    }
}
