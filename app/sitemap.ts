import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

// 强制动态渲染，不在构建时预渲染
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 检查是否启用 Sitemap
  const enableSitemap = await prisma.setting.findUnique({
    where: { key: "enableSitemap" },
  });

  if (enableSitemap?.value !== "true") {
    return [];
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://blog.vixenahri.cn";

  // 获取所有已发布文章
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true },
  });

  // 获取所有分类
  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });

  // 获取所有标签
  const tags = await prisma.tag.findMany({
    select: { slug: true, updatedAt: true },
  });

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: cat.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const tagUrls = tags.map((tag) => ({
    url: `${baseUrl}/tag/${tag.slug}`,
    lastModified: tag.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...postUrls,
    ...categoryUrls,
    ...tagUrls,
  ];
}
