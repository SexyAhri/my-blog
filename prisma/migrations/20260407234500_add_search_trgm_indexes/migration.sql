-- Enable trigram search support for ranked post search.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Speed up public search across the most important short-text fields.
CREATE INDEX IF NOT EXISTS "posts_published_title_trgm_idx"
  ON "posts"
  USING gin ("title" gin_trgm_ops)
  WHERE "published" = true;

CREATE INDEX IF NOT EXISTS "posts_published_slug_trgm_idx"
  ON "posts"
  USING gin ("slug" gin_trgm_ops)
  WHERE "published" = true;

CREATE INDEX IF NOT EXISTS "posts_published_excerpt_trgm_idx"
  ON "posts"
  USING gin ("excerpt" gin_trgm_ops)
  WHERE "published" = true;
