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

  const embeddingDim = embeddings[0]?.length ?? 0;
  if (embeddingDim === 0) return null;

  const destinationEmbedding = Array.from({ length: embeddingDim }, () => 0);

  for (const embedding of embeddings) {
    if (embedding.length !== embeddingDim) continue;
    for (let i = 0; i < embeddingDim; i++) {
      destinationEmbedding[i] += embedding[i] ?? 0;
    }
  }

  for (let i = 0; i < embeddingDim; i++) {
    destinationEmbedding[i] /= embeddings.length;
  }

  const norm = Math.sqrt(
    destinationEmbedding.reduce((sum, value) => sum + value * value, 0),
  );

  if (norm === 0) return destinationEmbedding;

  return destinationEmbedding.map((value) => value / norm);
}
