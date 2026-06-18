import { NlpTopicStorageService } from './nlp-topic-storage.service';

describe('NlpTopicStorageService', () => {
  const prisma = {
    topicGroup: { findMany: jest.fn() },
    topic: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };
  const aiNamingService = {
    generateTopicName: jest.fn(),
    classifyTopicGroup: jest.fn(),
  };
  const topicMapping = {
    normalizeModelVersion: jest.fn(
      (value?: string | null, trainedAt?: string | null) => {
        const version = value?.trim() || 'unversioned';
        return trainedAt?.trim() ? `${version}@${trainedAt.trim()}` : version;
      },
    ),
    resolveCanonicalTopicId: jest.fn(),
    saveMapping: jest.fn(),
  };

  const service = new NlpTopicStorageService(
    prisma as never,
    aiNamingService as never,
    topicMapping as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.topicGroup.findMany.mockResolvedValue([]);
    prisma.topic.findMany.mockResolvedValue([]);
    aiNamingService.classifyTopicGroup.mockReturnValue(null);
  });

  it('keeps a merged model topic mapped to its canonical topic', async () => {
    topicMapping.resolveCanonicalTopicId.mockResolvedValue(6);
    prisma.topic.findUnique.mockResolvedValue({
      id: 6,
      topicName: 'Pemandangan indah',
      groupId: 1,
      keywords: ['indah', 'bagus'],
    });
    prisma.topic.update.mockResolvedValue({ id: 6 });

    const result = await service.saveTopics({
      summary: { total: 1, positive: 1, negative: 0, neutral: 0 },
      results: [],
      topics: [
        {
          topic_id: 7,
          keywords: ['pemandangan', 'indah'],
          representative_docs: ['Pemandangannya sangat indah.'],
        },
      ],
      metadata: { topic_model_version: 'bertopic-v1' },
    });

    expect(result.get(7)).toBe(6);
    expect(prisma.topic.findUnique).toHaveBeenCalledWith({
      where: { id: 6 },
      select: { id: true, topicName: true, keywords: true, groupId: true },
    });
    expect(prisma.topic.create).not.toHaveBeenCalled();
    expect(aiNamingService.generateTopicName).not.toHaveBeenCalled();
    expect(prisma.topic.update).toHaveBeenCalledWith({
      where: { id: 6 },
      data: {
        keywords: ['indah', 'bagus', 'pemandangan'],
      },
    });
  });

  it('uses the training timestamp as part of the model identity', async () => {
    topicMapping.resolveCanonicalTopicId.mockResolvedValue(6);
    prisma.topic.findUnique.mockResolvedValue({
      id: 6,
      topicName: 'Pemandangan indah',
      groupId: 1,
      keywords: ['indah'],
    });
    prisma.topic.update.mockResolvedValue({ id: 6 });

    await service.saveTopics({
      summary: { total: 1, positive: 1, negative: 0, neutral: 0 },
      results: [],
      topics: [{ topic_id: 7, keywords: ['pemandangan'] }],
      metadata: {
        topic_model_version: 'bertopic-v1',
        topic_trained_at: '2026-06-13T09:02:27+00:00',
      },
    });

    expect(topicMapping.resolveCanonicalTopicId).toHaveBeenCalledWith(
      'bertopic-v1@2026-06-13T09:02:27+00:00',
      7,
    );
  });
});
