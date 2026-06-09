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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DestinationsService = void 0;
const common_1 = require("@nestjs/common");
const destination_admin_service_1 = require("./destination-admin.service");
const destination_catalog_service_1 = require("./destination-catalog.service");
const destination_detail_service_1 = require("./destination-detail.service");
let DestinationsService = class DestinationsService {
    admin;
    catalog;
    detail;
    constructor(admin, catalog, detail) {
        this.admin = admin;
        this.catalog = catalog;
        this.detail = detail;
    }
    create(dto) {
        return this.admin.create(dto);
    }
    findAll(page, limit, search, topicId, topicIds, city, category) {
        return this.catalog.findAll(page, limit, search, topicId, topicIds, city, category);
    }
    getCategories() {
        return this.catalog.getCategories();
    }
    getCities() {
        return this.catalog.getCities();
    }
    findOneAdmin(id) {
        return this.admin.findOneAdmin(id);
    }
    update(id, dto) {
        return this.admin.update(id, dto);
    }
    softDelete(id) {
        return this.admin.softDelete(id);
    }
    updateMapsUrl(id, dto) {
        return this.admin.updateMapsUrl(id, dto);
    }
    uploadThumbnail(destinationId, filename) {
        return this.admin.uploadThumbnail(destinationId, filename);
    }
    uploadImage(destinationId, filename) {
        return this.admin.uploadImage(destinationId, filename);
    }
    deleteImage(imageId) {
        return this.admin.deleteImage(imageId);
    }
    findRecommendations(page, limit) {
        return this.catalog.findRecommendations(page, limit);
    }
    findOnePublic(id) {
        return this.detail.findOnePublic(id);
    }
    findOnePublicBySlug(slug) {
        return this.detail.findOnePublicBySlug(slug);
    }
    findRanking(sortBy, limit) {
        return this.catalog.findRanking(sortBy, limit);
    }
    getReviewsByTopic(destinationId, topicId, page, limit) {
        return this.detail.getReviewsByTopic(destinationId, topicId, page, limit);
    }
    getReviewsByTopicGroup(destinationId, groupId, page, limit) {
        return this.detail.getReviewsByTopicGroup(destinationId, groupId, page, limit);
    }
};
exports.DestinationsService = DestinationsService;
exports.DestinationsService = DestinationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [destination_admin_service_1.DestinationAdminService,
        destination_catalog_service_1.DestinationCatalogService,
        destination_detail_service_1.DestinationDetailService])
], DestinationsService);
//# sourceMappingURL=destinations.service.js.map