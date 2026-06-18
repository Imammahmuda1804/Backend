import { TopicMergeService } from './topic-merge.service';

describe('TopicMergeService', () => {
  const transaction = {
    destinationTopic: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    review: { updateMany: jest.fn() },
    topic: { update: jest.fn(), deleteMany: jest.fn() },
    topicModelMapping: { updateMany: jest.fn() },
  };
  const prisma = {
    topic: { findMany: jest.fn() },
    $transaction: jest.fn(
      async (callback: (client: typeof transaction) => Promise<void>) =>
        callback(transaction),
    ),
  };
  const topicMapping = {
    moveMappings: jest.fn(),
  };
  const reviewTopicPersistence = {
    moveAssignments: jest.fn(),
  };
  const service = new TopicMergeService(
    prisma as never,
    topicMapping as never,
    reviewTopicPersistence as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.topic.findMany.mockResolvedValue([
      { id: 6, topicName: 'Pemandangan indah', keywords: ['indah'] },
      { id: 7, topicName: 'Pemandangan bagus', keywords: ['bagus'] },
    ]);
    transaction.destinationTopic.findMany.mockResolvedValue([]);
  });

  it('keeps model mappings when the source topic row is deleted', async () => {
    await service.mergeTopics(6, [7]);

    expect(topicMapping.moveMappings).toHaveBeenCalledWith(transaction, 6, [7]);
    expect(reviewTopicPersistence.moveAssignments).toHaveBeenCalledWith(
      transaction,
      6,
      [7],
    );
    expect(transaction.topic.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: [7] } },
    });
  });
});
