-- Keep BERTopic cluster identifiers separate from editable database topics.
CREATE TABLE "topic_model_mappings" (
  "id" SERIAL NOT NULL,
  "model_version" TEXT NOT NULL,
  "model_topic_id" INTEGER NOT NULL,
  "topic_id" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "topic_model_mappings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "topic_model_mappings_model_version_model_topic_id_key"
ON "topic_model_mappings"("model_version", "model_topic_id");

CREATE INDEX "topic_model_mappings_topic_id_idx"
ON "topic_model_mappings"("topic_id");

ALTER TABLE "topic_model_mappings"
ADD CONSTRAINT "topic_model_mappings_topic_id_fkey"
FOREIGN KEY ("topic_id") REFERENCES "topics"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing topic rows 0-39 belong to the active default BERTopic model.
INSERT INTO "topic_model_mappings" (
  "model_version",
  "model_topic_id",
  "topic_id"
)
SELECT
  'bertopic-birch-v34-final-default',
  "id",
  "id"
FROM "topics"
WHERE "id" BETWEEN 0 AND 39
ON CONFLICT ("model_version", "model_topic_id") DO NOTHING;

-- Explicit historic topic IDs may leave the SERIAL sequence behind.
SELECT setval(
  pg_get_serial_sequence('"topics"', 'id'),
  GREATEST((SELECT COALESCE(MAX("id"), 1) FROM "topics"), 1),
  true
);
