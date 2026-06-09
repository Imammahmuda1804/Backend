import { AnalyticsPeriod, SentimentDistribution } from './analytics.types';

const SENTIMENT_ALIASES: Record<string, keyof SentimentDistribution> = {
  positive: 'positive',
  positif: 'positive',
  negative: 'negative',
  negatif: 'negative',
  neutral: 'neutral',
  netral: 'neutral',
};

export function normalizeAnalyticsSentiment(
  sentiment: string | null | undefined,
): keyof SentimentDistribution {
  const normalized = (sentiment ?? '').toLowerCase();
  return SENTIMENT_ALIASES[normalized] ?? 'neutral';
}

export function buildSentimentDistribution(
  counts: Array<{ sentiment: string | null; _count: { sentiment: number } }>,
): SentimentDistribution {
  const distribution: SentimentDistribution = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  for (const row of counts) {
    distribution[normalizeAnalyticsSentiment(row.sentiment)] +=
      row._count.sentiment;
  }

  return distribution;
}

export function getAnalyticsPeriodKey(
  date: Date,
  period: AnalyticsPeriod,
): string {
  const value = new Date(date);

  if (period === 'daily') {
    return value.toISOString().slice(0, 10);
  }

  if (period === 'weekly') {
    const day = value.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(value);
    monday.setDate(value.getDate() + diffToMonday);
    return monday.toISOString().slice(0, 10);
  }

  return value.toISOString().slice(0, 7);
}

export function toSortedTrendRows<T extends object>(grouped: Map<string, T>) {
  return Array.from(grouped.entries())
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([date, counts]) => ({ date, ...counts }));
}

export function roundAnalyticsMetric(value: number) {
  return Math.round(value * 1000) / 1000;
}
