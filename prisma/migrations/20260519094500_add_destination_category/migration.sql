ALTER TABLE "destinations"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'alam';

CREATE INDEX "destinations_category_idx" ON "destinations"("category");
