"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopicsModule = void 0;
const common_1 = require("@nestjs/common");
const topics_controller_1 = require("./topics.controller");
const topics_service_1 = require("./topics.service");
const nlp_module_1 = require("../nlp/nlp.module");
const topic_group_service_1 = require("./topic-group.service");
const topic_management_service_1 = require("./topic-management.service");
const topic_merge_service_1 = require("./topic-merge.service");
const topic_query_service_1 = require("./topic-query.service");
const topic_review_service_1 = require("./topic-review.service");
let TopicsModule = class TopicsModule {
};
exports.TopicsModule = TopicsModule;
exports.TopicsModule = TopicsModule = __decorate([
    (0, common_1.Module)({
        imports: [nlp_module_1.NlpModule],
        controllers: [topics_controller_1.TopicsController, topics_controller_1.AdminTopicsController],
        providers: [
            topics_service_1.TopicsService,
            topic_query_service_1.TopicQueryService,
            topic_review_service_1.TopicReviewService,
            topic_merge_service_1.TopicMergeService,
            topic_group_service_1.TopicGroupService,
            topic_management_service_1.TopicManagementService,
        ],
    })
], TopicsModule);
//# sourceMappingURL=topics.module.js.map