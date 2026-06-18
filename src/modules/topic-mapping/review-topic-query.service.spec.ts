import { ReviewTopicQueryService } from './review-topic-query.service';

describe('ReviewTopicQueryService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  };
  const service = new ReviewTopicQueryService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes database counts into JavaScript numbers', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { topicId: 6, totalReviews: BigInt(12) },
    ]);

    await expect(service.getTopicCounts(4)).resolves.toEqual([
      { topicId: 6, totalReviews: 12 },
    ]);
  });

  it('returns a paginated set of reviews assigned to any requested aspect', async () => {
    prisma.$queryRaw
      .mockResolvedValueOnce([
        {
          id: 91,
          topicId: 6,
          score: 0.91,
          isPrimary: true,
          assignmentMethod: 'bertopic_transform',
        },
        {
          id: 44,
          topicId: 7,
          score: 0.42,
          isPrimary: false,
          assignmentMethod: 'aspect_distribution',
        },
      ])
      .mockResolvedValueOnce([{ total: BigInt(2) }]);

    await expect(
      service.findReviewPage({
        topicIds: [6, 7],
        destinationId: 4,
        sentiments: ['positive'],
        skip: 0,
        take: 10,
      }),
    ).resolves.toEqual({
      reviewIds: [91, 44],
      total: 2,
      assignmentsByReviewId: new Map([
        [
          91,
          [
            {
              topicId: 6,
              score: 0.91,
              isPrimary: true,
              assignmentMethod: 'bertopic_transform',
            },
          ],
        ],
        [
          44,
          [
            {
              topicId: 7,
              score: 0.42,
              isPrimary: false,
              assignmentMethod: 'aspect_distribution',
            },
          ],
        ],
      ]),
    });
  });
});
