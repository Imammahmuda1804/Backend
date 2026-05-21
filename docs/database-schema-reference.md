# Database Schema Reference

This document is a readable schema map. It is not an executable migration.

## Core Tables

- `users`: application users, auth role, account status, optional profile picture.
- `destinations`: tourism destination profile, location, category, ratings, thumbnail, pgvector embedding, recommendation metrics, and soft delete timestamp.
- `destination_images`: gallery images for destinations.
- `reviews`: scraped Google Maps reviews with cleaned text, sentiment, confidence, topic, and scraper job relation.
- `review_embeddings`: pgvector embedding for each scraped review.
- `topics`: fine-grained NLP topics attached to reviews and destination topic summaries.
- `topic_groups`: broad UI grouping for fine topics.
- `destination_topics`: destination-topic aggregate counts.
- `sentiment_trends`: monthly sentiment counts per destination.
- `favorites`: user wishlist relation.
- `search_logs`: authenticated user search history.
- `user_reviews`: reviews submitted by app users.
- `scraping_jobs`: async scraping job state.
- `scraping_history`: scraper run metadata and filters.

## Fixed Values

- `Role`: `ADMIN`, `USER`.
- `destinations.category`: `alam`, `pantai`, `budaya`, `sejarah`, `kuliner`, `religi`, `keluarga`, `petualangan`, `edukasi`, `belanja`.

## Raw SQL / Database-specific Features

- `vector` extension is enabled for embeddings.
- HNSW indexes are used for destination and review embeddings.
- Category validity is enforced with a database `CHECK` constraint.
- Topic groups are inserted by the `seed_topic_groups` migration.
