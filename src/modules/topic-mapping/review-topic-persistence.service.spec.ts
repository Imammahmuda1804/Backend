import { ReviewTopicPersistenceService } from './review-topic-persistence.service';

describe('ReviewTopicPersistenceService', () => {
  const transaction = {
    $executeRaw: jest.fn(),
  };
  const service = new ReviewTopicPersistenceService();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces all aspect assignments for one review', async () => {
    await service.replaceAssignments(transaction as never, 101, [
      {
        topicId: 6,
        score: 0.72,
        isPrimary: true,
        assignmentMethod: 'primary_transform',
      },
    ]);

    expect(transaction.$executeRaw).toHaveBeenCalledTimes(2);
  });

  it('moves source aspects to the canonical topic before deleting sources', async () => {
    await service.moveAssignments(transaction as never, 6, [7, 8]);

    expect(transaction.$executeRaw).toHaveBeenCalledTimes(2);
  });
});
