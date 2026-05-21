# Prisma Migration Guidelines

Prisma migrations in this project are chronological changesets. They should not be split or rewritten into one file per table after they have been applied, because Prisma tracks migration directory names in `_prisma_migrations`.

The current active migration chain is resettable and intentionally starts from a clean baseline. Legacy migrations are archived in `backend/docs/migration-archive/legacy-prisma-migrations`.

## Rules

- Use the current baseline migration as the starting point for fresh local databases.
- Create new migrations for new schema changes.
- Name migrations by intent, for example `add_destination_category` or `add_topic_groups`.
- Group changes by feature or domain behavior, not by table ownership.
- Use raw SQL migrations only when Prisma cannot model the feature directly, such as `pgvector` indexes or database-level `CHECK` constraints.
- Do not edit `dist/` files when changing schema or backend source.

## Active Migration Shape

- `baseline_schema`: extension, enum, all tables, base indexes, and foreign keys.
- `add_vector_indexes`: HNSW vector indexes.
- `add_destination_category_constraint`: allowed category values enforced at DB level.
- `seed_topic_groups`: static topic group data.

Foreign keys are placed after the `CREATE TABLE` and index blocks so table creation order is simple and relation constraints are easy to audit.

## Reset Flow

Only run this for a disposable local database:

1. Back up data if needed.
2. Run `npx prisma migrate reset`.
3. Run import/seed scripts for any external data.
4. Verify with `npx prisma migrate status`.
