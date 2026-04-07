-- 添加系列表
CREATE TABLE IF NOT EXISTS "series" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- 添加系列唯一约束
CREATE UNIQUE INDEX IF NOT EXISTS "series_name_key" ON "series"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "series_slug_key" ON "series"("slug");

-- 添加文章点赞表
CREATE TABLE IF NOT EXISTS "post_likes" (
    "visitorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("visitorId","postId")
);

-- 添加点赞索引
CREATE INDEX IF NOT EXISTS "post_likes_postId_idx" ON "post_likes"("postId");

-- 添加点赞外键
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_postId_fkey" 
    FOREIGN KEY ("postId") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 添加文章新字段
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "likeCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "seriesId" TEXT;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "seriesOrder" INTEGER;
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

-- 添加系列外键
ALTER TABLE "posts" ADD CONSTRAINT "posts_seriesId_fkey" 
    FOREIGN KEY ("seriesId") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加定时发布索引
CREATE INDEX IF NOT EXISTS "posts_scheduledAt_idx" ON "posts"("scheduledAt");
