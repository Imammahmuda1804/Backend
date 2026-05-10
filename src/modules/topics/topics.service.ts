import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TopicsService {
    constructor(private readonly prisma: PrismaService) { }

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
}
