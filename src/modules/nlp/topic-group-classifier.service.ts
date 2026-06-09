import { Injectable } from '@nestjs/common';

export interface TopicGroupCandidate {
  id: number;
  groupName: string;
  keywords: string[];
}

@Injectable()
export class TopicGroupClassifierService {
  classify(
    topicName: string,
    keywords: string[],
    representativeDocs: string[],
    groups: TopicGroupCandidate[],
  ) {
    if (groups.length === 0) return null;

    const corpus = [topicName, ...keywords, ...representativeDocs]
      .join(' ')
      .toLowerCase();
    return (
      this.findBestMatch(corpus, groups)?.id ?? this.pickFallbackGroupId(groups)
    );
  }

  private findBestMatch(corpus: string, groups: TopicGroupCandidate[]) {
    let bestGroup: TopicGroupCandidate | null = null;
    let bestScore = 0;

    for (const group of groups) {
      const score = group.keywords.reduce(
        (total, keyword) =>
          corpus.includes(keyword.toLowerCase()) ? total + 1 : total,
        0,
      );
      if (score > bestScore) {
        bestScore = score;
        bestGroup = group;
      }
    }
    return bestGroup;
  }

  private pickFallbackGroupId(groups: TopicGroupCandidate[]) {
    const fallback = groups.find((group) =>
      group.groupName.toLowerCase().includes('lain'),
    );
    if (fallback) return fallback.id;

    const lastGroup = groups.at(-1);
    return lastGroup ? lastGroup.id : null;
  }
}
