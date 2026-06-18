import { NestFactory } from '@nestjs/core';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import type { NlpPipelineResult } from './modules/nlp/interfaces/nlp-pipeline-result.interface';
import { NlpTopicStorageService } from './modules/nlp/nlp-topic-storage.service';

export interface TrainingTopicMetadata {
  model_version?: string;
  trained_at?: string;
  topic_keywords?: Record<string, string[]>;
}

export type TopicSyncSummary = {
  processedTopicsCount: number;
  canonicalTopicsCount: number;
};

async function bootstrap() {
  console.log('Starting BERTopic metadata topic sync...');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const metadata = readTrainingMetadata(getTrainingMetadataPath());
    const summary = await syncTopicsFromMetadata(
      metadata,
      app.get(NlpTopicStorageService),
    );
    logSummary(summary);
  } finally {
    await app.close();
  }
}

/**
 * Menyinkronkan metadata model melalui resolver topik kanonis yang sama dengan
 * pipeline NLP, sehingga topik yang sudah digabung admin tidak dibuat ulang.
 */
export async function syncTopicsFromMetadata(
  metadata: TrainingTopicMetadata,
  topicStorage: Pick<NlpTopicStorageService, 'saveTopics'>,
): Promise<TopicSyncSummary> {
  const topics = buildPipelineTopics(metadata.topic_keywords ?? {});
  const mappings = await topicStorage.saveTopics(
    buildPipelineResult(metadata.model_version, metadata.trained_at, topics),
  );

  return {
    processedTopicsCount: topics.length,
    canonicalTopicsCount: new Set(mappings.values()).size,
  };
}

function getTrainingMetadataPath() {
  return path.join(
    __dirname,
    '../../Model/app/models/bertopic/training_metadata.json',
  );
}

function readTrainingMetadata(metadataPath: string): TrainingTopicMetadata {
  assertMetadataFileExists(metadataPath);
  console.log(`Reading file: ${metadataPath}`);

  return JSON.parse(
    fs.readFileSync(metadataPath, 'utf-8'),
  ) as TrainingTopicMetadata;
}

function assertMetadataFileExists(metadataPath: string) {
  if (fs.existsSync(metadataPath)) return;

  throw new Error(
    `Metadata file not found at ${metadataPath}. Run BERTopic training first.`,
  );
}

function buildPipelineTopics(topicKeywords: Record<string, string[]>) {
  return Object.entries(topicKeywords)
    .map(([topicId, keywords]) => ({
      topic_id: Number.parseInt(topicId, 10),
      keywords: Array.isArray(keywords) ? keywords : [],
    }))
    .filter(
      (topic) => Number.isInteger(topic.topic_id) && topic.topic_id !== -1,
    );
}

function buildPipelineResult(
  modelVersion: string | undefined,
  trainedAt: string | undefined,
  topics: NlpPipelineResult['topics'],
): NlpPipelineResult {
  return {
    summary: { total: 0, positive: 0, negative: 0, neutral: 0 },
    results: [],
    topics,
    metadata: {
      topic_model_version: modelVersion,
      topic_trained_at: trainedAt,
    },
  };
}

function logSummary(summary: TopicSyncSummary) {
  console.log('Topic sync completed.');
  console.log(`- Model topics processed: ${summary.processedTopicsCount}`);
  console.log(`- Canonical database topics: ${summary.canonicalTopicsCount}`);
}

if (require.main === module) {
  bootstrap()
    .then(() => process.exit(0))
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
