import { TopicModelMappingService } from './topic-model-mapping.service';

describe('TopicModelMappingService', () => {
  const topicModelMapping = {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    updateMany: jest.fn(),
  };

  const prisma = { topicModelMapping };
  const service = new TopicModelMappingService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves a model topic to its canonical database topic', async () => {
    topicModelMapping.findUnique.mockResolvedValue({ topicId: 6 });

    await expect(
      service.resolveCanonicalTopicId('bertopic-v1', 7),
    ).resolves.toBe(6);
    expect(topicModelMapping.findUnique).toHaveBeenCalledWith({
      where: {
        modelVersion_modelTopicId: {
          modelVersion: 'bertopic-v1',
          modelTopicId: 7,
        },
      },
      select: { topicId: true },
    });
  });

  it('separates retrained models that reuse the same version label', () => {
    expect(
      service.normalizeModelVersion(
        'bertopic-v1',
        '2026-06-12T09:02:27.411170+00:00',
      ),
    ).toBe('bertopic-v1@2026-06-12T09:02:27.411170+00:00');
    expect(
      service.normalizeModelVersion(
        'bertopic-v1',
        '2026-06-13T09:02:27.411170+00:00',
      ),
    ).not.toBe('bertopic-v1@2026-06-12T09:02:27.411170+00:00');
  });

  it('moves mappings from merged source topics to the canonical target', async () => {
    topicModelMapping.updateMany.mockResolvedValue({ count: 2 });

    await service.moveMappings(prisma as never, 6, [7, 8]);

    expect(topicModelMapping.updateMany).toHaveBeenCalledWith({
      where: { topicId: { in: [7, 8] } },
      data: { topicId: 6 },
    });
  });
});
