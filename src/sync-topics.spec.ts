import { syncTopicsFromMetadata } from './sync-topics';

describe('syncTopicsFromMetadata', () => {
  it('uses the canonical NLP topic storage flow', async () => {
    const topicStorage = {
      saveTopics: jest.fn().mockResolvedValue(
        new Map([
          [6, 6],
          [7, 6],
        ]),
      ),
    };

    const result = await syncTopicsFromMetadata(
      {
        model_version: 'bertopic-v1',
        trained_at: '2026-06-13T09:02:27+00:00',
        topic_keywords: {
          '6': ['pemandangan', 'indah'],
          '7': ['pemandangan', 'bagus'],
          '-1': ['noise'],
        },
      },
      topicStorage,
    );

    expect(result).toEqual({
      processedTopicsCount: 2,
      canonicalTopicsCount: 1,
    });
    expect(topicStorage.saveTopics).toHaveBeenCalledWith({
      summary: { total: 0, positive: 0, negative: 0, neutral: 0 },
      results: [],
      topics: [
        { topic_id: 6, keywords: ['pemandangan', 'indah'] },
        { topic_id: 7, keywords: ['pemandangan', 'bagus'] },
      ],
      metadata: {
        topic_model_version: 'bertopic-v1',
        topic_trained_at: '2026-06-13T09:02:27+00:00',
      },
    });
  });
});
