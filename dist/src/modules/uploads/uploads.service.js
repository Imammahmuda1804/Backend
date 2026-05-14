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
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const file_parser_service_1 = require("./file-parser.service");
const common_2 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let UploadsService = UploadsService_1 = class UploadsService {
    prisma;
    fileParser;
    nlpQueue;
    logger = new common_2.Logger(UploadsService_1.name);
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
        const firstRow = validData.length > 0 ? validData[0] : {};
        const mapping = (0, file_parser_service_1.detectColumnMapping)(firstRow, this.logger);
        this.logger.log(`Raw column keys: ${JSON.stringify(Object.keys(firstRow))}`);
        this.logger.log(`Sample mapped values from row[0]: reviewText=${JSON.stringify(mapping.reviewText ? firstRow[mapping.reviewText] : null)}, reviewDate=${JSON.stringify(mapping.reviewDate ? firstRow[mapping.reviewDate] : null)}, reviewerName=${JSON.stringify(mapping.reviewerName ? firstRow[mapping.reviewerName] : null)}`);
        const reviewsToInsert = validData.map((row) => {
            const reviewText = mapping.reviewText ? row[mapping.reviewText] : null;
            const rating = mapping.rating ? row[mapping.rating] : null;
            const reviewerName = mapping.reviewerName ? row[mapping.reviewerName] : 'Anonymous';
            const dateRaw = mapping.reviewDate ? row[mapping.reviewDate] : null;
            const likesCount = mapping.likesCount ? row[mapping.likesCount] : null;
            let reviewDate = null;
            try {
                if (dateRaw) {
                    if (dateRaw instanceof Date) {
                        reviewDate = dateRaw;
                    }
                    else if (typeof dateRaw === 'number') {
                        if (dateRaw < 100000) {
                            reviewDate = new Date(Math.round((dateRaw - 25569) * 86400 * 1000));
                        }
                        else {
                            reviewDate = new Date(dateRaw);
                        }
                    }
                    else if (typeof dateRaw === 'string') {
                        const parsedDate = new Date(dateRaw);
                        if (!isNaN(parsedDate.getTime())) {
                            reviewDate = parsedDate;
                        }
                    }
                }
            }
            catch (error) {
            }
            return {
                destinationId,
                scrapingJobId: job.id,
                reviewerName: String(reviewerName || 'Anonymous').substring(0, 255),
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
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('nlp-queue')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        file_parser_service_1.FileParserService,
        bullmq_2.Queue])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map