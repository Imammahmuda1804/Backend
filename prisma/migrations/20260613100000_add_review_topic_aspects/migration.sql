CREATE TABLE "review_topics" (
  "id" SERIAL NOT NULL,
  "review_id" INTEGER NOT NULL,
  "topic_id" INTEGER NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "assignment_method" TEXT NOT NULL DEFAULT 'aspect_distribution',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "review_topics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "review_topics_review_id_topic_id_key"
ON "review_topics"("review_id", "topic_id");

CREATE INDEX "review_topics_topic_id_idx"
ON "review_topics"("topic_id");

CREATE INDEX "review_topics_review_id_is_primary_idx"
ON "review_topics"("review_id", "is_primary");

ALTER TABLE "review_topics"
ADD CONSTRAINT "review_topics_review_id_fkey"
FOREIGN KEY ("review_id") REFERENCES "reviews"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_topics"
ADD CONSTRAINT "review_topics_topic_id_fkey"
FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve all existing single-topic assignments as primary aspects.
INSERT INTO "review_topics" (
  "review_id",
  "topic_id",
  "score",
  "is_primary",
  "assignment_method"
)
SELECT
  "id",
  "topic_id",
  1.0,
  true,
  'legacy_primary'
FROM "reviews"
WHERE "topic_id" IS NOT NULL
ON CONFLICT ("review_id", "topic_id") DO NOTHING;
