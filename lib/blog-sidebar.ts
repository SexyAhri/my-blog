import { prisma } from "@/lib/prisma";
import { cache, CACHE_TTL } from "@/lib/cache";
import { DEFAULT_SITE_MOTTO } from "@/lib/site-config";

export interface SidebarCategory {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

export interface SidebarTag {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

export interface SidebarPost {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  viewCount: number;
}

export interface BlogSidebarData {
  categories: SidebarCategory[];
  tags: SidebarTag[];
  recentPosts: SidebarPost[];
  hotPosts: SidebarPost[];
  postCount: number;
  commentCount: number;
  motto: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
}

function serializeSidebarPost(post: {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  createdAt: Date;
  viewCount: number;
}): SidebarPost {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
    viewCount: post.viewCount,
  };
}

export async function getBlogSidebarData(): Promise<BlogSidebarData> {
  return cache.cached(
    "sidebar:blog",
    async () => {
      const [categories, tags, recentPosts, hotPosts, settings, postCount, commentCount] =
        await Promise.all([
          prisma.category.findMany({
            include: {
              _count: {
                select: {
                  posts: {
                    where: {
                      published: true,
                    },
                  },
                },
              },
            },
            orderBy: { name: "asc" },
          }),
          prisma.tag.findMany({
            include: {
              _count: {
                select: {
                  posts: {
                    where: {
                      post: {
                        published: true,
                      },
                    },
                  },
                },
              },
            },
            orderBy: { name: "asc" },
            take: 15,
          }),
          prisma.post.findMany({
            where: { published: true },
            select: {
              id: true,
              title: true,
              slug: true,
              publishedAt: true,
              createdAt: true,
              viewCount: true,
            },
            orderBy: { publishedAt: "desc" },
            take: 5,
          }),
          prisma.post.findMany({
            where: { published: true },
            select: {
              id: true,
              title: true,
              slug: true,
              publishedAt: true,
              createdAt: true,
              viewCount: true,
            },
            orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
            take: 5,
          }),
          prisma.setting.findMany({
            where: {
              key: {
                in: ["siteMotto", "siteAvatar", "siteProfileBanner"],
              },
            },
          }),
          prisma.post.count({
            where: { published: true },
          }),
          prisma.comment.count({
            where: { approved: true },
          }),
        ]);

      const settingsMap: Record<string, string> = {};
      for (const setting of settings) {
        settingsMap[setting.key] = setting.value;
      }

      return {
        categories,
        tags,
        recentPosts: recentPosts.map(serializeSidebarPost),
        hotPosts: hotPosts.map(serializeSidebarPost),
        postCount,
        commentCount,
        motto: settingsMap.siteMotto || DEFAULT_SITE_MOTTO,
        avatarUrl: settingsMap.siteAvatar || null,
        bannerUrl: settingsMap.siteProfileBanner || null,
      };
    },
    CACHE_TTL.MEDIUM,
  );
}
