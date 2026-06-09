// Mengubah label sentimen dari service Python ke format backend.
export function mapPipelineSentiment(sentiment: string): string {
  const sentimentMap: Record<string, string> = {
    positif: 'positive',
    negatif: 'negative',
    netral: 'neutral',
  };

  return sentimentMap[sentiment.toLowerCase()] || sentiment;
}

// Menghitung rata-rata embedding review lalu menormalisasinya untuk destinasi.
export function averageAndNormalizeEmbeddings(
  embeddings: number[][],
): number[] | null {
  if (embeddings.length === 0) return null;

  const embeddingDim = getEmbeddingDimension(embeddings);
  if (embeddingDim === 0) return null;

  const usableEmbeddings = embeddings.filter((embedding) =>
    hasExpectedDimension(embedding, embeddingDim),
  );
  if (usableEmbeddings.length === 0) return null;

  const summedEmbedding = sumEmbeddingColumns(usableEmbeddings, embeddingDim);
  const averagedEmbedding = summedEmbedding.map(
    (value) => value / usableEmbeddings.length,
  );

  return normalizeVector(averagedEmbedding);
}

function getEmbeddingDimension(embeddings: number[][]): number {
  return embeddings.find((embedding) => embedding.length > 0)?.length ?? 0;
}

function hasExpectedDimension(embedding: number[], dimension: number): boolean {
  return embedding.length === dimension;
}

function sumEmbeddingColumns(
  embeddings: number[][],
  dimension: number,
): number[] {
  const totals = Array.from({ length: dimension }, () => 0);

  for (const embedding of embeddings) {
    for (let index = 0; index < dimension; index++) {
      totals[index] += embedding[index] ?? 0;
    }
  }

  return totals;
}

function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (norm === 0) return vector;

  return vector.map((value) => value / norm);
}
