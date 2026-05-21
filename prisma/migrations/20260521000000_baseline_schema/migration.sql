-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'active',
    "profile_picture" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'alam',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "google_maps_url" TEXT,
    "google_place_id" TEXT,
    "google_rating" DOUBLE PRECISION,
    "google_review_count" INTEGER,
    "user_rating" DOUBLE PRECISION,
    "user_review_count" INTEGER,
    "youtube_url" TEXT,
    "thumbnail_url" TEXT,
    "embedding" vector(384),
    "positive_ratio" DOUBLE PRECISION,
    "recommendation_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_images" (
    "id" SERIAL NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "destination_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "review_text" TEXT,
    "cleaned_text" TEXT,
    "rating" INTEGER,
    "review_date" TIMESTAMP(3),
    "source" TEXT DEFAULT 'google_maps',
    "likes_count" INTEGER,
    "owner_reply" TEXT,
    "sentiment" TEXT,
    "sentiment_confidence" DOUBLE PRECISION,
    "topic_id" INTEGER,
    "scraping_job_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_embeddings" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "embedding" vector(384),

    CONSTRAINT "review_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_groups" (
    "id" SERIAL NOT NULL,
    "group_name" TEXT NOT NULL,
    "description" TEXT,
    "keywords" JSONB,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" SERIAL NOT NULL,
    "topic_name" TEXT NOT NULL,
    "keywords" JSONB,
    "group_id" INTEGER,
    "label_type" TEXT NOT NULL DEFAULT 'fine',
    "is_search_visible" BOOLEAN NOT NULL DEFAULT true,
    "is_detail_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "destination_topics" (
    "id" SERIAL NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "destination_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sentiment_trends" (
    "id" SERIAL NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "positive_count" INTEGER NOT NULL DEFAULT 0,
    "negative_count" INTEGER NOT NULL DEFAULT 0,
    "neutral_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sentiment_trends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "keyword" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraping_jobs" (
    "id" SERIAL NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'google_maps',
    "total_reviews" INTEGER,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraping_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraping_history" (
    "id" SERIAL NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "job_id" INTEGER NOT NULL,
    "total_reviews" INTEGER,
    "stars_filter" JSONB,
    "has_text" BOOLEAN,
    "sort" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraping_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE INDEX "destinations_slug_idx" ON "destinations"("slug");

-- CreateIndex
CREATE INDEX "destinations_city_idx" ON "destinations"("city");

-- CreateIndex
CREATE INDEX "destinations_category_idx" ON "destinations"("category");

-- CreateIndex
CREATE INDEX "destinations_province_idx" ON "destinations"("province");

-- CreateIndex
CREATE INDEX "destinations_recommendation_score_idx" ON "destinations"("recommendation_score");

-- CreateIndex
CREATE INDEX "destinations_deleted_at_idx" ON "destinations"("deleted_at");

-- CreateIndex
CREATE INDEX "destination_images_destination_id_idx" ON "destination_images"("destination_id");

-- CreateIndex
CREATE INDEX "reviews_destination_id_idx" ON "reviews"("destination_id");

-- CreateIndex
CREATE INDEX "reviews_sentiment_idx" ON "reviews"("sentiment");

-- CreateIndex
CREATE INDEX "reviews_topic_id_idx" ON "reviews"("topic_id");

-- CreateIndex
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at");

-- CreateIndex
CREATE INDEX "reviews_scraping_job_id_idx" ON "reviews"("scraping_job_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_embeddings_review_id_key" ON "review_embeddings"("review_id");

-- CreateIndex
CREATE INDEX "topics_group_id_idx" ON "topics"("group_id");

-- CreateIndex
CREATE INDEX "topics_is_search_visible_idx" ON "topics"("is_search_visible");

-- CreateIndex
CREATE UNIQUE INDEX "destination_topics_destination_id_topic_id_key" ON "destination_topics"("destination_id", "topic_id");

-- CreateIndex
CREATE INDEX "sentiment_trends_destination_id_idx" ON "sentiment_trends"("destination_id");

-- CreateIndex
CREATE INDEX "sentiment_trends_date_idx" ON "sentiment_trends"("date");

-- CreateIndex
CREATE UNIQUE INDEX "sentiment_trends_destination_id_date_key" ON "sentiment_trends"("destination_id", "date");

-- CreateIndex
CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_destination_id_key" ON "favorites"("user_id", "destination_id");

-- CreateIndex
CREATE INDEX "search_logs_user_id_idx" ON "search_logs"("user_id");

-- CreateIndex
CREATE INDEX "search_logs_created_at_idx" ON "search_logs"("created_at");

-- CreateIndex
CREATE INDEX "user_reviews_user_id_idx" ON "user_reviews"("user_id");

-- CreateIndex
CREATE INDEX "user_reviews_destination_id_idx" ON "user_reviews"("destination_id");

-- CreateIndex
CREATE INDEX "scraping_jobs_destination_id_idx" ON "scraping_jobs"("destination_id");

-- CreateIndex
CREATE INDEX "scraping_jobs_status_idx" ON "scraping_jobs"("status");

-- CreateIndex
CREATE INDEX "scraping_jobs_created_at_idx" ON "scraping_jobs"("created_at");

-- CreateIndex
CREATE INDEX "scraping_history_destination_id_idx" ON "scraping_history"("destination_id");

-- CreateIndex
CREATE INDEX "scraping_history_job_id_idx" ON "scraping_history"("job_id");

-- AddForeignKey
ALTER TABLE "destination_images" ADD CONSTRAINT "destination_images_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_scraping_job_id_fkey" FOREIGN KEY ("scraping_job_id") REFERENCES "scraping_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_embeddings" ADD CONSTRAINT "review_embeddings_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "topic_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_topics" ADD CONSTRAINT "destination_topics_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "destination_topics" ADD CONSTRAINT "destination_topics_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sentiment_trends" ADD CONSTRAINT "sentiment_trends_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_logs" ADD CONSTRAINT "search_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scraping_jobs" ADD CONSTRAINT "scraping_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scraping_history" ADD CONSTRAINT "scraping_history_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scraping_history" ADD CONSTRAINT "scraping_history_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "scraping_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
