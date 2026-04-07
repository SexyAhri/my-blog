# Maintenance Notes

This document records the current runtime and maintenance expectations for the blog after the SSR and Prisma migration cleanup.

## Public Rendering Model

The public blog is intentionally SSR-first.

- `lib/public-posts.ts` powers the home page, category pages, tag pages, archive pages, and public search
- `lib/public-settings.ts` provides public site settings and analytics configuration
- `lib/blog-sidebar.ts` builds the sidebar payload on the server
- `lib/public-comments.ts` provides the initial approved comment tree and comment toggle state

The following UI pieces should keep reading from server helpers instead of issuing mount-time fetches:

- Blog sidebar
- Category navigation
- Blog footer
- Analytics configuration
- Initial article comment section data

If a new public component needs blog-wide settings or sidebar-style aggregates, prefer extending the existing server helpers instead of adding another client fetch.

## Cache Model

The project uses a small in-memory cache in `lib/cache.ts`.

Current invalidation helpers:

- `invalidatePublicSettingsCache()`
- `invalidateSidebarCache()`
- `invalidateCommentCaches()`
- `invalidatePostCaches(slugs?)`
- `invalidateTaxonomyCaches()`

Mutation routes should call the matching invalidation helper after successful writes. A good rule of thumb:

- Post create, update, delete, schedule, publish, like count changes: invalidate post caches and usually taxonomy/sidebar caches
- Category or tag changes: invalidate taxonomy caches
- Public setting changes: invalidate public settings cache and, when relevant, sidebar cache
- Comment moderation changes: invalidate comment caches

## Search Notes

Search ranking in `lib/public-posts.ts` supports two modes:

- Preferred: PostgreSQL trigram similarity via `pg_trgm`
- Fallback: `ILIKE` ranking when `pg_trgm` is unavailable

The migration `20260407234500_add_search_trgm_indexes` enables `pg_trgm` and adds GIN trigram indexes for published post search on:

- `posts.title`
- `posts.slug`
- `posts.excerpt`

If deploy migrations cannot create extensions in your database environment, install `pg_trgm` first and rerun `npm run prisma:migrate:deploy`.

## Database Workflow

Prisma migrations are now the canonical schema history.

Use these commands:

```bash
# Local development
npm run prisma:migrate

# Production / CI / Docker
npm run prisma:migrate:deploy

# Safe first-admin bootstrap
npm run prisma:bootstrap

# Demo/local reset with sample content
npm run prisma:seed
```

Avoid using `db push` as a replacement for real migrations in shared or production environments.
`prisma:seed` is destructive in this repository because it clears existing data before loading demo content.

## Docker Auto Deploy

The Docker path is the only production deployment path in this repository.

Current flow:

- Push to `master`
- GitHub Actions builds and pushes `ahridocker/my-blog`
- Watchtower detects the new image and recreates the app container
- The container entrypoint runs `prisma migrate deploy`
- If the database is empty, the entrypoint bootstraps the first admin user and default site settings
- The app starts after the database step succeeds

Relevant knobs:

- `RUN_DB_MIGRATIONS`
- `BOOTSTRAP_ADMIN_ON_EMPTY_DB`
- `DB_MIGRATION_MAX_RETRIES`
- `DB_MIGRATION_RETRY_INTERVAL`

## Media Library Notes

The media admin page does more than store uploads. It also audits usage across:

- Post cover images
- Post content
- Series cover images
- Public/admin settings that reference uploads
- User images

Delete operations should stay usage-aware. If you add new places that store upload paths, update the media usage scanner so audit results and safe-delete rules remain correct.

## Verification Checklist

Run this after meaningful backend, schema, or rendering changes:

```bash
npm run lint
npm run build
```

For database-related changes, also verify:

```bash
npm run prisma:migrate
```
