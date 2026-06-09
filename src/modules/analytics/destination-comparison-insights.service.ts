import { Injectable } from '@nestjs/common';
import {
  CompareDestinationSnapshot,
  CompareFactorKey,
  CompareTopicSignal,
  SentimentDistribution,
} from './analytics.types';
import { roundAnalyticsMetric } from './analytics.utils';

type ComparisonDestinationSource = {
  category: string;
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  positiveRatio: number | null;
  recommendationScore: number | null;
};

@Injectable()
export class DestinationComparisonInsightsService {
  buildSnapshotInsights(
    destination: ComparisonDestinationSource,
    topics: CompareTopicSignal[],
    sentiment: SentimentDistribution,
  ) {
    return {
      topic_groups: this.buildTopicGroups(topics),
      travel_traits: this.buildTravelTraits(destination.category, topics),
      decision_factors: this.buildDecisionFactors(
        destination,
        topics,
        sentiment,
      ),
      highlights: this.pickTopicSignals(topics, 'highlight'),
      risks: this.pickTopicSignals(topics, 'risk'),
    };
  }

  buildComparison(
    destination1: CompareDestinationSnapshot,
    destination2: CompareDestinationSnapshot,
  ) {
    const recommended = this.pickRecommendedDestination(
      destination1,
      destination2,
    );

    return {
      sentiment_winner: this.pickWinnerId(
        destination1,
        destination2,
        (destination) => destination.positive_ratio ?? 0,
      ),
      rating_winner: this.pickWinnerId(
        destination1,
        destination2,
        (destination) => destination.rating.google ?? 0,
      ),
      recommendation_winner: this.pickWinnerId(
        destination1,
        destination2,
        (destination) => destination.recommendation_score ?? 0,
      ),
      score_difference: roundAnalyticsMetric(
        Math.abs(
          (destination1.recommendation_score ?? 0) -
            (destination2.recommendation_score ?? 0),
        ),
      ),
      insights: this.buildCompareInsights(
        destination1,
        destination2,
        recommended,
      ),
    };
  }

  private pickWinnerId(
    destination1: CompareDestinationSnapshot,
    destination2: CompareDestinationSnapshot,
    score: (destination: CompareDestinationSnapshot) => number,
  ) {
    return score(destination1) >= score(destination2)
      ? destination1.id
      : destination2.id;
  }
  private buildTopicGroups(topics: CompareTopicSignal[]) {
    const groups = new Map<string, number>();

    for (const topic of topics) {
      const groupName = topic.group_name || 'Topik lainnya';
      groups.set(groupName, (groups.get(groupName) ?? 0) + topic.total_reviews);
    }

    return Array.from(groups.entries())
      .map(([group_name, total_reviews]) => ({ group_name, total_reviews }))
      .sort((first, second) => second.total_reviews - first.total_reviews)
      .slice(0, 5);
  }

  private buildTravelTraits(
    category: string,
    topics: CompareTopicSignal[],
  ): Record<string, number> {
    const text = this.topicText(topics);

    return {
      family: this.scoreKeywords(text, category, [
        'keluarga',
        'anak',
        'edukasi',
        'aman',
        'nyaman',
      ]),
      couple: this.scoreKeywords(text, category, [
        'romantis',
        'tenang',
        'foto',
        'pemandangan',
        'sunset',
      ]),
      solo: this.scoreKeywords(text, category, [
        'tenang',
        'mudah',
        'aman',
        'murah',
        'akses',
      ]),
      photo_spot: this.scoreKeywords(text, category, [
        'foto',
        'spot',
        'pemandangan',
        'indah',
        'ikonik',
      ]),
      relaxing: this.scoreKeywords(text, category, [
        'tenang',
        'asri',
        'sejuk',
        'nyaman',
        'healing',
      ]),
      culture: this.scoreKeywords(text, category, [
        'budaya',
        'sejarah',
        'tradisi',
        'museum',
        'religi',
      ]),
      adventure: this.scoreKeywords(text, category, [
        'petualangan',
        'alam',
        'trekking',
        'air terjun',
        'akses susah',
      ]),
    };
  }

  private buildDecisionFactors(
    destination: {
      googleMapsUrl: string | null;
      latitude: number | null;
      longitude: number | null;
      positiveRatio: number | null;
      recommendationScore: number | null;
    },
    topics: CompareTopicSignal[],
    sentiment: SentimentDistribution,
  ): Record<CompareFactorKey, number> {
    const text = this.topicText(topics);
    const quality = Math.round(
      (destination.positiveRatio ?? 0.5) * 55 +
        (destination.recommendationScore ?? 0.5) * 45,
    );

    return {
      access: this.scoreAccessFactor(destination, text),
      cost_value: this.scoreCostValueFactor(quality, text),
      cleanliness: this.scoreCleanlinessFactor(quality, text),
      facilities: this.scoreFacilitiesFactor(text),
      crowd: this.scoreCrowdFactor(text, sentiment),
      view_activity: this.scoreViewActivityFactor(quality, text),
    };
  }

  private scoreAccessFactor(
    destination: {
      googleMapsUrl: string | null;
      latitude: number | null;
      longitude: number | null;
    },
    text: string,
  ) {
    const locationBonus =
      destination.googleMapsUrl ||
      (destination.latitude && destination.longitude)
        ? 12
        : 0;

    return this.clampScore(
      48 +
        locationBonus +
        this.keywordDelta(text, ['akses mudah', 'jalan bagus', 'mudah'], 18) -
        this.keywordDelta(text, ['akses susah', 'jalan rusak', 'macet'], 22),
    );
  }

  private scoreCostValueFactor(quality: number, text: string) {
    return this.clampScore(
      quality +
        this.keywordDelta(text, ['murah', 'terjangkau', 'worth'], 12) -
        this.keywordDelta(text, ['mahal', 'pungli', 'biaya'], 22),
    );
  }

  private scoreCleanlinessFactor(quality: number, text: string) {
    return this.clampScore(
      quality +
        this.keywordDelta(text, ['bersih', 'terawat', 'nyaman'], 15) -
        this.keywordDelta(text, ['kotor', 'tidak terawat', 'sampah'], 24),
    );
  }

  private scoreFacilitiesFactor(text: string) {
    return this.clampScore(
      50 +
        this.keywordDelta(text, ['toilet', 'parkir', 'mushola', 'warung'], 22) -
        this.keywordDelta(text, ['fasilitas kurang', 'toilet kotor'], 16),
    );
  }

  private scoreCrowdFactor(
    text: string,
    sentiment: Pick<SentimentDistribution, 'positive' | 'negative'>,
  ) {
    const negativePenalty = sentiment.negative > sentiment.positive ? 8 : 0;

    return this.clampScore(
      58 +
        this.keywordDelta(text, ['tenang', 'sepi', 'nyaman'], 18) -
        this.keywordDelta(text, ['ramai', 'padat', 'antri'], 20) -
        negativePenalty,
    );
  }

  private scoreViewActivityFactor(quality: number, text: string) {
    return this.clampScore(
      quality +
        this.keywordDelta(
          text,
          ['pemandangan', 'foto', 'aktivitas', 'budaya', 'kuliner', 'pantai'],
          18,
        ),
    );
  }

  private pickTopicSignals(
    topics: CompareTopicSignal[],
    kind: 'highlight' | 'risk',
  ): string[] {
    const keywords =
      kind === 'highlight'
        ? [
            'indah',
            'bagus',
            'bersih',
            'nyaman',
            'murah',
            'mudah',
            'foto',
            'budaya',
            'asri',
            'tenang',
            'menarik',
            'lengkap',
          ]
        : [
            'mahal',
            'pungli',
            'kotor',
            'susah',
            'rusak',
            'ramai',
            'macet',
            'kurang',
            'tidak',
            'buruk',
            'parkir',
          ];
    const matched = topics
      .filter((topic) =>
        keywords.some((keyword) =>
          topic.topic_name.toLowerCase().includes(keyword),
        ),
      )
      .map((topic) => this.cleanTopicName(topic.topic_name))
      .filter(Boolean)
      .slice(0, 4);

    if (matched.length > 0) return [...new Set(matched)];

    return topics
      .map((topic) => this.cleanTopicName(topic.topic_name))
      .filter(Boolean)
      .slice(0, kind === 'highlight' ? 3 : 2);
  }

  private pickRecommendedDestination(
    destination1: CompareDestinationSnapshot,
    destination2: CompareDestinationSnapshot,
  ) {
    return this.scoreRecommendedDestination(destination1) >=
      this.scoreRecommendedDestination(destination2)
      ? destination1
      : destination2;
  }

  private scoreRecommendedDestination(destination: CompareDestinationSnapshot) {
    return (
      this.recommendationScore(destination) * 0.45 +
      this.positiveRatio(destination) * 0.3 +
      this.normalizedRating(destination) * 0.15 +
      this.noRiskBonus(destination)
    );
  }

  private recommendationScore(destination: CompareDestinationSnapshot) {
    return destination.recommendation_score ?? 0;
  }

  private positiveRatio(destination: CompareDestinationSnapshot) {
    return destination.positive_ratio ?? 0;
  }

  private normalizedRating(destination: CompareDestinationSnapshot) {
    const rating = destination.rating.user ?? destination.rating.google ?? 0;
    return rating / 5;
  }

  private noRiskBonus(destination: CompareDestinationSnapshot) {
    return destination.risks.length === 0 ? 0.1 : 0;
  }

  private buildCompareInsights(
    destination1: CompareDestinationSnapshot,
    destination2: CompareDestinationSnapshot,
    recommended: CompareDestinationSnapshot,
  ) {
    const alternative =
      recommended.id === destination1.id ? destination2 : destination1;
    const bestFor = Object.entries(recommended.travel_traits)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([key]) => this.traitLabel(key));

    return {
      recommended_destination_id: recommended.id,
      summary: `${recommended.name} lebih cocok dipilih jika Anda mengejar ${bestFor.join(', ').toLowerCase()}. ${alternative.name} tetap menarik sebagai pembanding, terutama jika faktor risikonya sesuai toleransi perjalanan Anda.`,
      best_for: bestFor,
      tradeoffs: [
        ...recommended.highlights
          .slice(0, 2)
          .map((item) => `${recommended.name}: ${item}`),
        ...alternative.risks
          .slice(0, 2)
          .map(
            (item) => `${alternative.name}: perlu cek ${item.toLowerCase()}`,
          ),
      ].slice(0, 4),
      score_cards: [
        this.buildScoreCard(destination1),
        this.buildScoreCard(destination2),
      ],
    };
  }

  private buildScoreCard(destination: CompareDestinationSnapshot) {
    const factorValues = Object.values(destination.decision_factors);
    const factorAverage =
      factorValues.reduce((sum, value) => sum + value, 0) / factorValues.length;

    return {
      destination_id: destination.id,
      label: destination.name,
      score: this.clampScore(
        (destination.recommendation_score ?? 0.5) * 45 +
          (destination.positive_ratio ?? 0.5) * 25 +
          factorAverage * 0.3,
      ),
      reasons: [
        ...destination.highlights.slice(0, 2),
        ...destination.risks.slice(0, 1),
      ],
    };
  }

  private topicText(topics: CompareTopicSignal[]) {
    return topics.map((topic) => topic.topic_name.toLowerCase()).join(' ');
  }

  private scoreKeywords(text: string, category: string, keywords: string[]) {
    const categoryHit = keywords.some((keyword) => category.includes(keyword))
      ? 18
      : 0;

    return this.clampScore(
      42 + categoryHit + this.keywordDelta(text, keywords, 18),
    );
  }

  private keywordDelta(text: string, keywords: string[], amount: number) {
    const hits = keywords.filter((keyword) => text.includes(keyword)).length;
    return Math.min(amount, hits * Math.ceil(amount / 2));
  }

  private clampScore(value: number) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private cleanTopicName(name: string) {
    return name.replace(/^Topic \d+:\s*/, '').trim();
  }

  private traitLabel(key: string) {
    const labels: Record<string, string> = {
      family: 'Keluarga',
      couple: 'Pasangan',
      solo: 'Solo traveler',
      photo_spot: 'Foto',
      relaxing: 'Santai',
      culture: 'Budaya',
      adventure: 'Petualangan',
    };

    return labels[key] ?? key;
  }
}
