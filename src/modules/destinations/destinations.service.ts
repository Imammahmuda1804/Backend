import { Injectable } from '@nestjs/common';
import { DestinationAdminService } from './destination-admin.service';
import { DestinationCatalogService } from './destination-catalog.service';
import { DestinationDetailService } from './destination-detail.service';
import type { UploadableImage } from '../storage/media-storage.types';
import {
  CreateDestinationDto,
  UpdateDestinationDto,
  UpdateMapsUrlDto,
} from './dto';

/**
 * Facade destinasi yang menjaga kontrak lama untuk controller.
 *
 * Implementasi dibagi menjadi tiga service:
 * - admin: CRUD dan media;
 * - catalog: daftar, filter, rekomendasi, ranking;
 * - detail: halaman publik, review per topik, dan agregasi topik.
 */
@Injectable()
export class DestinationsService {
  constructor(
    private readonly admin: DestinationAdminService,
    private readonly catalog: DestinationCatalogService,
    private readonly detail: DestinationDetailService,
  ) {}

  create(dto: CreateDestinationDto) {
    return this.admin.create(dto);
  }

  findAll(
    page: number,
    limit: number,
    search?: string,
    topicId?: number,
    topicIds?: number[],
    city?: string,
    category?: string,
  ) {
    return this.catalog.findAll(
      page,
      limit,
      search,
      topicId,
      topicIds,
      city,
      category,
    );
  }

  getCategories() {
    return this.catalog.getCategories();
  }

  getCities() {
    return this.catalog.getCities();
  }

  findOneAdmin(id: number) {
    return this.admin.findOneAdmin(id);
  }

  update(id: number, dto: UpdateDestinationDto) {
    return this.admin.update(id, dto);
  }

  softDelete(id: number) {
    return this.admin.softDelete(id);
  }

  updateMapsUrl(id: number, dto: UpdateMapsUrlDto) {
    return this.admin.updateMapsUrl(id, dto);
  }

  uploadThumbnail(destinationId: number, file: UploadableImage) {
    return this.admin.uploadThumbnail(destinationId, file);
  }

  uploadImage(destinationId: number, file: UploadableImage) {
    return this.admin.uploadImage(destinationId, file);
  }

  deleteImage(imageId: number) {
    return this.admin.deleteImage(imageId);
  }

  findRecommendations(page: number, limit: number) {
    return this.catalog.findRecommendations(page, limit);
  }

  findOnePublic(id: number) {
    return this.detail.findOnePublic(id);
  }

  findOnePublicBySlug(slug: string) {
    return this.detail.findOnePublicBySlug(slug);
  }

  findRanking(sortBy: string, limit: number) {
    return this.catalog.findRanking(sortBy, limit);
  }

  getReviewsByTopic(
    destinationId: number,
    topicId: number,
    page: number,
    limit: number,
  ) {
    return this.detail.getReviewsByTopic(destinationId, topicId, page, limit);
  }

  getReviewsByTopicGroup(
    destinationId: number,
    groupId: number,
    page: number,
    limit: number,
  ) {
    return this.detail.getReviewsByTopicGroup(
      destinationId,
      groupId,
      page,
      limit,
    );
  }
}
