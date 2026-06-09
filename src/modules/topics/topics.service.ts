import { Injectable } from '@nestjs/common';
import { TopicGroupService } from './topic-group.service';
import { TopicManagementService } from './topic-management.service';
import { TopicMergeService } from './topic-merge.service';
import { TopicQueryService } from './topic-query.service';
import { TopicReviewService } from './topic-review.service';
import type {
  TopicGroupPayload,
  TopicReviewSentiment,
  TopicScope,
} from './topic.types';

export { normalizeTopicNameForMatch } from './topic-name.util';

/**
 * Facade topik yang dipakai controller.
 *
 * Setiap pekerjaan diteruskan ke provider yang lebih khusus agar alur kode
 * mudah dicari tanpa mengubah kontrak API yang sudah digunakan frontend.
 */
@Injectable()
export class TopicsService {
  constructor(
    private readonly queryService: TopicQueryService,
    private readonly reviewService: TopicReviewService,
    private readonly mergeService: TopicMergeService,
    private readonly groupService: TopicGroupService,
    private readonly managementService: TopicManagementService,
  ) {}

  findAll(scope?: TopicScope) {
    return this.queryService.findAll(scope);
  }

  findGroups() {
    return this.queryService.findGroups();
  }

  findDestinationsByTopic(topicId: number, page: number, limit: number) {
    return this.queryService.findDestinationsByTopic(topicId, page, limit);
  }

  findReviewsByTopic(
    topicId: number,
    page: number,
    limit: number,
    sentiment?: TopicReviewSentiment,
    destinationId?: number,
  ) {
    return this.reviewService.findReviewsByTopic(
      topicId,
      page,
      limit,
      sentiment,
      destinationId,
    );
  }

  renameUnnamedTopics() {
    return this.managementService.renameUnnamedTopics();
  }

  renameTopic(topicId: number, newName: string) {
    return this.managementService.renameTopic(topicId, newName);
  }

  findTopicByNormalizedName(topicName: string, excludeId?: number) {
    return this.mergeService.findTopicByNormalizedName(topicName, excludeId);
  }

  mergeTopics(targetTopicId: number, sourceTopicIds: number[]) {
    return this.mergeService.mergeTopics(targetTopicId, sourceTopicIds);
  }

  updateTopicSettings(
    topicId: number,
    data: {
      groupId?: number | null;
      isSearchVisible?: boolean;
      isDetailVisible?: boolean;
    },
  ) {
    return this.managementService.updateTopicSettings(topicId, data);
  }

  renameGroup(groupId: number, groupName: string) {
    return this.groupService.renameGroup(groupId, groupName);
  }

  createGroup(data: TopicGroupPayload) {
    return this.groupService.createGroup(data);
  }

  updateGroup(groupId: number, data: TopicGroupPayload) {
    return this.groupService.updateGroup(groupId, data);
  }

  deleteGroup(groupId: number) {
    return this.groupService.deleteGroup(groupId);
  }

  deleteTopic(topicId: number) {
    return this.managementService.deleteTopic(topicId);
  }
}
