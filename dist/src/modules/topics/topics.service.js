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
exports.TopicsService = exports.normalizeTopicNameForMatch = void 0;
const common_1 = require("@nestjs/common");
const topic_group_service_1 = require("./topic-group.service");
const topic_management_service_1 = require("./topic-management.service");
const topic_merge_service_1 = require("./topic-merge.service");
const topic_query_service_1 = require("./topic-query.service");
const topic_review_service_1 = require("./topic-review.service");
var topic_name_util_1 = require("./topic-name.util");
Object.defineProperty(exports, "normalizeTopicNameForMatch", { enumerable: true, get: function () { return topic_name_util_1.normalizeTopicNameForMatch; } });
let TopicsService = class TopicsService {
    queryService;
    reviewService;
    mergeService;
    groupService;
    managementService;
    constructor(queryService, reviewService, mergeService, groupService, managementService) {
        this.queryService = queryService;
        this.reviewService = reviewService;
        this.mergeService = mergeService;
        this.groupService = groupService;
        this.managementService = managementService;
    }
    findAll(scope, destinationId) {
        return this.queryService.findAll(scope, destinationId);
    }
    findGroups() {
        return this.queryService.findGroups();
    }
    findDestinationsByTopic(topicId, page, limit) {
        return this.queryService.findDestinationsByTopic(topicId, page, limit);
    }
    findReviewsByTopic(topicId, page, limit, sentiment, destinationId) {
        return this.reviewService.findReviewsByTopic(topicId, page, limit, sentiment, destinationId);
    }
    renameUnnamedTopics() {
        return this.managementService.renameUnnamedTopics();
    }
    renameTopic(topicId, newName) {
        return this.managementService.renameTopic(topicId, newName);
    }
    findTopicByNormalizedName(topicName, excludeId) {
        return this.mergeService.findTopicByNormalizedName(topicName, excludeId);
    }
    mergeTopics(targetTopicId, sourceTopicIds) {
        return this.mergeService.mergeTopics(targetTopicId, sourceTopicIds);
    }
    updateTopicSettings(topicId, data) {
        return this.managementService.updateTopicSettings(topicId, data);
    }
    renameGroup(groupId, groupName) {
        return this.groupService.renameGroup(groupId, groupName);
    }
    createGroup(data) {
        return this.groupService.createGroup(data);
    }
    updateGroup(groupId, data) {
        return this.groupService.updateGroup(groupId, data);
    }
    deleteGroup(groupId) {
        return this.groupService.deleteGroup(groupId);
    }
    deleteTopic(topicId) {
        return this.managementService.deleteTopic(topicId);
    }
};
exports.TopicsService = TopicsService;
exports.TopicsService = TopicsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [topic_query_service_1.TopicQueryService,
        topic_review_service_1.TopicReviewService,
        topic_merge_service_1.TopicMergeService,
        topic_group_service_1.TopicGroupService,
        topic_management_service_1.TopicManagementService])
], TopicsService);
//# sourceMappingURL=topics.service.js.map