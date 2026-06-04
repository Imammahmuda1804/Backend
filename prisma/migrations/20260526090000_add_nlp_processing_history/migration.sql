-- Add stable review identity for idempotent NLP uploads.
ALTER TABLE "reviews"
ADD COLUMN "review_hash" TEXT;

CREATE UNIQUE INDEX "reviews_destination_id_source_review_hash_key"
ON "reviews"("destination_id", "source", "review_hash");

-- Track every manual NLP processing run from admin.
CREATE TABLE "nlp_processing_runs" (
  "id" SERIAL NOT NULL,
  "destination_id" INTEGER NOT NULL,
  "admin_id" INTEGER,
  "file_name" TEXT NOT NULL,
  "file_hash" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'skip_existing',
  "status" TEXT NOT NULL DEFAULT 'processing',
  "total_rows" INTEGER NOT NULL DEFAULT 0,
  "inserted_reviews" INTEGER NOT NULL DEFAULT 0,
  "skipped_duplicates" INTEGER NOT NULL DEFAULT 0,
  "processed_reviews" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finished_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "nlp_processing_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "nlp_processing_runs_destination_id_idx" ON "nlp_processing_runs"("destination_id");
CREATE INDEX "nlp_processing_runs_admin_id_idx" ON "nlp_processing_runs"("admin_id");
CREATE INDEX "nlp_processing_runs_file_hash_idx" ON "nlp_processing_runs"("file_hash");
CREATE INDEX "nlp_processing_runs_status_idx" ON "nlp_processing_runs"("status");
CREATE INDEX "nlp_processing_runs_started_at_idx" ON "nlp_processing_runs"("started_at");

ALTER TABLE "nlp_processing_runs"
ADD CONSTRAINT "nlp_processing_runs_destination_id_fkey"
FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "nlp_processing_runs"
ADD CONSTRAINT "nlp_processing_runs_admin_id_fkey"
FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
