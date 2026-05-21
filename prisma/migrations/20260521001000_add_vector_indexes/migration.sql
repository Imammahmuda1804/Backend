-- CreateVectorIndexes
CREATE INDEX IF NOT EXISTS "destinations_embedding_idx" ON "destinations" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX IF NOT EXISTS "review_embeddings_embedding_idx" ON "review_embeddings" USING hnsw ("embedding" vector_cosine_ops);
