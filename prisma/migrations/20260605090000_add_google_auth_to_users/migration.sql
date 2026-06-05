-- Add Google OAuth account linking fields.
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

ALTER TABLE "users"
  ADD COLUMN "google_id" TEXT,
  ADD COLUMN "auth_provider" TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
