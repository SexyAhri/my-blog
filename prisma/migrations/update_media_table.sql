-- 更新 media 表结构
-- 添加新字段
ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'file';
ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS "alt" TEXT;
ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "public"."media" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 删除旧字段
ALTER TABLE "public"."media" DROP COLUMN IF EXISTS "url";

-- 如果有数据，设置默认的 userId（使用第一个用户的 ID）
DO $$
DECLARE
  first_user_id TEXT;
BEGIN
  SELECT id INTO first_user_id FROM "public"."users" LIMIT 1;
  IF first_user_id IS NOT NULL THEN
    UPDATE "public"."media" SET "userId" = first_user_id WHERE "userId" IS NULL;
  END IF;
END $$;

-- 添加外键约束
ALTER TABLE "public"."media" 
  ADD CONSTRAINT "media_userId_fkey" 
  FOREIGN KEY ("userId") 
  REFERENCES "public"."users"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;
