import { Injectable, Logger } from '@nestjs/common';
import { NlpDestinationAnalyticsStorageService } from './nlp-destination-analytics-storage.service';
import { NlpPipelineResult } from './interfaces/nlp-pipeline-result.interface';
import { NlpReviewStorageService } from './nlp-review-storage.service';
import { NlpTopicStorageService } from './nlp-topic-storage.service';

/**
 * Mengatur urutan penyimpanan hasil pipeline NLP.
 *
 * Detail penyimpanan dipisahkan berdasarkan domain agar alurnya mudah dibaca:
 * topik disimpan lebih dulu, lalu review/embedding, kemudian analytics
 * destinasi dihitung ulang dari data final.
 */
@Injectable()
export class NlpResultStorageService {
  private readonly logger = new Logger(NlpResultStorageService.name);

  constructor(
    private readonly topicStorage: NlpTopicStorageService,
    private readonly reviewStorage: NlpReviewStorageService,
    private readonly destinationAnalytics: NlpDestinationAnalyticsStorageService,
  ) {}

  async saveNlpResults(
    destinationId: number,
    nlpResult: NlpPipelineResult,
    reviewIds: number[],
  ): Promise<void> {
    this.logPipelineResult(destinationId, nlpResult);

    const savedTopicIds = await this.topicStorage.saveTopics(nlpResult);
    await this.reviewStorage.save(
      destinationId,
      nlpResult,
      reviewIds,
      savedTopicIds,
    );
    await this.destinationAnalytics.refresh(destinationId);
  }

  private logPipelineResult(
    destinationId: number,
    nlpResult: NlpPipelineResult,
  ) {
    this.logger.log(
      `NLP result summary for destination ${destinationId}: ${JSON.stringify(
        nlpResult.summary,
      )}`,
    );

    this.logDiscoveredTopics(nlpResult.new_topics?.length ?? 0);
    this.logPipelineWarning(nlpResult.warning);
    this.logModelMetadata(nlpResult.metadata);
  }

  private logDiscoveredTopics(topicCount: number) {
    if (topicCount === 0) return;
    this.logger.log(`${topicCount} new topics discovered by NLP pipeline`);
  }

  private logPipelineWarning(warning?: string) {
    if (!warning) return;
    this.logger.warn(`Pipeline warning: ${warning}`);
  }

  private logModelMetadata(metadata?: NlpPipelineResult['metadata']) {
    if (!metadata) return;
    this.logger.log(`NLP model metadata: ${JSON.stringify(metadata)}`);
  }
}
