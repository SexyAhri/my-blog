import { prisma } from "@/lib/prisma";

export interface PostReference {
  title: string;
  slug: string;
}

export interface RelatedPostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt: string;
}

export interface SeriesPostSummary {
  id: string;
  title: string;
  slug: string;
  seriesOrder: number;
}

export interface PostDetailData {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  author: {
    id: string;
    name: string | null;
    email: string;
    image?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  series?: {
    id: string;
    name: string;
    slug: string;
  };
  seriesOrder?: number;
  prevPost?: PostReference;
  nextPost?: PostReference;
  relatedPosts: RelatedPostSummary[];
  seriesPosts: SeriesPostSummary[];
}

function toIsoString(date: Date | null | undefined, fallback: Date): string {
  return (date ?? fallback).toISOString();
}

export async function getPublishedPostDetail(
  slug: string,
): Promise<PostDetailData | null> {
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      author: {
        select: { id: true, name: true, email: true, image: true },
      },
      category: {
        select: { id: true, name: true, slug: true },
      },
      tags: {
        include: {
          tag: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      series: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!post) {
    return null;
  }

  const [prevPost, nextPost, relatedPosts, seriesPosts] = await Promise.all([
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            published: true,
            publishedAt: { lt: post.publishedAt },
          },
          orderBy: { publishedAt: "desc" },
          select: { title: true, slug: true },
        })
      : null,
    post.publishedAt
      ? prisma.post.findFirst({
          where: {
            published: true,
            publishedAt: { gt: post.publishedAt },
          },
          orderBy: { publishedAt: "asc" },
          select: { title: true, slug: true },
        })
      : null,
    post.categoryId
      ? prisma.post.findMany({
          where: {
            published: true,
            categoryId: post.categoryId,
            NOT: { id: post.id },
          },
          take: 5,
          orderBy: { publishedAt: "desc" },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            coverImage: true,
            publishedAt: true,
            createdAt: true,
          },
        })
      : Promise.resolve([]),
    post.seriesId
      ? prisma.post.findMany({
          where: {
            seriesId: post.seriesId,
            published: true,
          },
          orderBy: { seriesOrder: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            seriesOrder: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt ?? undefined,
    coverImage: post.coverImage ?? undefined,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: toIsoString(post.publishedAt, post.createdAt),
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    author: {
      id: post.author.id,
      name: post.author.name,
      email: post.author.email,
      image: post.author.image ?? undefined,
    },
    category: post.category ?? undefined,
    tags: post.tags,
    series: post.series ?? undefined,
    seriesOrder: post.seriesOrder ?? undefined,
    prevPost: prevPost ?? undefined,
    nextPost: nextPost ?? undefined,
    relatedPosts: relatedPosts.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt ?? undefined,
      coverImage: item.coverImage ?? undefined,
      publishedAt: toIsoString(item.publishedAt, item.createdAt),
    })),
    seriesPosts: seriesPosts.map((item, index) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      seriesOrder: item.seriesOrder ?? index + 1,
    })),
  };
}
