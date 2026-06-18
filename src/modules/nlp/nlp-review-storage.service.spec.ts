import { NlpReviewStorageService } from './nlp-review-storage.service';

describe('NlpReviewStorageService', () => {
  const transaction = {
    review: { update: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(
      async (callback: (client: typeof transaction) => Promise<void>) =>
        callback(transaction),
    ),
  };
  const vectorService = {
    batchInsertReviewEmbeddings: jest.fn(),
    upsertDestinationEmbedding: jest.fn(),
  };
  const reviewTopicPersistence = {
    replaceAssignments: jest.fn(),
  };
  const service = new NlpReviewStorageService(
    prisma as never,
    vectorService as never,
    reviewTopicPersistence as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores primary and secondary topic aspects for each review', async () => {
    await service.save(
      10,
      {
        summary: { total: 1, positive: 1, negative: 0, neutral: 0 },
        topics: [],
        results: [
          {
            review_id: 101,
            text: 'Pemandangan indah tetapi akses sulit.',
            cleaned_text: 'pemandangan indah akses sulit',
            sentiment: 'positif',
            topic_id: 7,
            topic_assignments: [
              {
                topic_id: 7,
                score: 0.72,
                is_primary: true,
                assignment_method: 'primary_transform',
              },
              {
                topic_id: 8,
                score: 0.54,
                is_primary: false,
                assignment_method: 'aspect_distribution',
              },
            ],
            embedding: [],
          },
        ],
      },
      [101],
      new Map([
        [7, 6],
        [8, 9],
      ]),
    );

    expect(transaction.review.update).toHaveBeenCalledWith({
      where: { id: 101 },
      data: {
        cleanedText: 'pemandangan indah akses sulit',
        sentiment: 'positive',
        sentimentConfidence: undefined,
        topicId: 6,
      },
    });
    expect(reviewTopicPersistence.replaceAssignments).toHaveBeenCalledWith(
      transaction,
      101,
      [
        {
          topicId: 6,
          score: 0.72,
          isPrimary: true,
          assignmentMethod: 'primary_transform',
        },
        {
          topicId: 9,
          score: 0.54,
          isPrimary: false,
          assignmentMethod: 'aspect_distribution',
        },
      ],
    );
  });

  it('collapses model aspects that map to the same canonical topic', async () => {
    await service.save(
      10,
      {
        summary: { total: 1, positive: 1, negative: 0, neutral: 0 },
        topics: [],
        results: [
          {
            review_id: 101,
            text: 'Pemandangan bagus.',
            cleaned_text: 'pemandangan bagus',
            sentiment: 'positif',
            topic_id: 7,
            topic_assignments: [
              {
                topic_id: 7,
                score: 0.61,
                is_primary: true,
                assignment_method: 'primary_transform',
              },
              {
                topic_id: 8,
                score: 0.73,
                is_primary: false,
                assignment_method: 'aspect_distribution',
              },
            ],
            embedding: [],
          },
        ],
      },
      [101],
      new Map([
        [7, 6],
        [8, 6],
      ]),
    );

    expect(reviewTopicPersistence.replaceAssignments).toHaveBeenCalledWith(
      transaction,
      101,
      [
        {
          topicId: 6,
          score: 0.73,
          isPrimary: true,
          assignmentMethod: 'primary_transform',
        },
      ],
    );
  });
});
