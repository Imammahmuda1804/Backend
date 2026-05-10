"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const file_parser_service_1 = require("./file-parser.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let UploadsService = class UploadsService {
    prisma;
    fileParser;
    nlpQueue;
    constructor(prisma, fileParser, nlpQueue) {
        this.prisma = prisma;
        this.fileParser = fileParser;
        this.nlpQueue = nlpQueue;
    }
    async processUpload(destinationId, file, adminId) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        if (file.size > 10 * 1024 * 1024) {
            throw new common_1.BadRequestException('File melebihi batas maksimal 10MB');
        }
        const destination = await this.prisma.destination.findUnique({
            where: { id: destinationId },
        });
        if (!destination) {
            throw new common_1.NotFoundException('Destination not found');
        }
        const parsedData = this.fileParser.parseExcelOrCsv(file.buffer, file.originalname);
        const validData = this.fileParser.validateRows(parsedData);
        const job = await this.prisma.scrapingJob.create({
            data: {
                destinationId,
                status: 'completed',
                source: 'upload',
                totalReviews: validData.length,
                startedAt: new Date(),
                finishedAt: new Date(),
                createdBy: adminId,
            },
        });
        const reviewsToInsert = validData.map((row) => {
            const getVal = (keys) => {
                const foundKey = Object.keys(row).find((k) => keys.some((searchKey) => k.toLowerCase().includes(searchKey)));
                return foundKey ? row[foundKey] : null;
            };
            const reviewText = getVal([
                'text',
                'review',
                'content',
                'ulasan',
                'teks',
                'komentar',
            ]);
            const rating = getVal(['rating', 'star', 'score', 'nilai', 'bintang']);
            const reviewerName = getVal(['name', 'author', 'user', 'nama', 'penulis']) || 'Anonymous';
            const dateRaw = getVal([
                'date',
                'time',
                'published',
                'tanggal',
                'waktu',
            ]);
            const likesCount = getVal(['like', 'helpful', 'suka', 'berguna']);
            let reviewDate = null;
            if (dateRaw &&
                (typeof dateRaw === 'string' || typeof dateRaw === 'number')) {
                const parsedDate = new Date(dateRaw);
                if (!isNaN(parsedDate.getTime())) {
                    reviewDate = parsedDate;
                }
            }
            return {
                destinationId,
                scrapingJobId: job.id,
                reviewerName: String(reviewerName).substring(0, 255),
                reviewText: reviewText ? String(reviewText) : null,
                rating: rating ? parseInt(String(rating), 10) : null,
                reviewDate,
                likesCount: likesCount ? parseInt(String(likesCount), 10) : 0,
                source: 'upload',
            };
        });
        await this.prisma.review.createMany({
            data: reviewsToInsert,
        });
        await this.nlpQueue.add('process-nlp', {
            jobId: job.id,
            destinationId,
        });
        return {
            message: 'File uploaded and NLP processing started',
            job_id: job.id,
            total_rows: validData.length,
        };
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('nlp-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        file_parser_service_1.FileParserService,
        bullmq_2.Queue])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map