import { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_POSTS_PER_PAGE } from "@/lib/site-config";

const publicPostInclude = Prisma.validator<Prisma.PostInclude>()({
  author: {
    select: {
      name: true,
    },
  },
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  tags: {
    include: {
      tag: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  },
});

type PublicPostRecord = Prisma.PostGetPayload<{
  include: typeof publicPostInclude;
}>;

export interface PublicPostCardData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  author: {
    name: string;
  };
  category?: {
    name: string;
    slug: string;
  };
  tags: Array<{
    tag: {
      name: string;
      slug: string;
    };
  }>;
}

export interface PublicPaginationData {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface TagSummary {
  id: string;
  name: string;
  slug: string;
}

export type PublicPostSort = "latest" | "hot" | "liked";

export interface HomePageData {
  posts: PublicPostCardData[];
  pagination: PublicPaginationData;
}

export interface ArchivePostSummary {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
}

export interface ArchiveGroup {
  year: number;
  months: Array<{
    month: number;
    posts: ArchivePostSummary[];
  }>;
}

interface SearchRow {
  id: string;
  score: number;
}

let pgTrgmSupportPromise: Promise<boolean> | null = null;

function serializePublicPost(post: PublicPostRecord): PublicPostCardData {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? undefined,
    coverImage: post.coverImage ?? undefined,
    publishedAt: post.publishedAt?.toISOString() ?? post.createdAt.toISOString(),
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    author: {
      name: post.author.name ?? "",
    },
    category: post.category ?? undefined,
    tags: post.tags,
  };
}

async function hasPgTrgmSupport() {
  if (!pgTrgmSupportPromise) {
    pgTrgmSupportPromise = prisma
      .$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT 1
          FROM pg_extension
          WHERE extname = 'pg_trgm'
        ) AS "exists"
      `
      .then((rows) => rows[0]?.exists ?? false)
      .catch(() => false);
  }

  return pgTrgmSupportPromise;
}

export async function getPublicPostsPerPage() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "postsPerPage" },
      select: { value: true },
    });

    if (!setting?.value) {
      return DEFAULT_POSTS_PER_PAGE;
    }

    const parsed = Number.parseInt(setting.value, 10);
    return parsed > 0 ? parsed : DEFAULT_POSTS_PER_PAGE;
  } catch {
    return DEFAULT_POSTS_PER_PAGE;
  }
}

function getPostOrderBy(sort: PublicPostSort): Prisma.PostOrderByWithRelationInput[] {
  return sort === "hot"
    ? [{ viewCount: "desc" }, { publishedAt: "desc" }]
    : sort === "liked"
      ? [{ likeCount: "desc" }, { publishedAt: "desc" }]
      : [{ publishedAt: "desc" }];
}

async function getPaginatedPosts(
  where: Prisma.PostWhereInput,
  page: number,
  sort: PublicPostSort = "latest",
): Promise<{
  posts: PublicPostCardData[];
  pagination: PublicPaginationData;
}> {
  const pageSize = await getPublicPostsPerPage();
  const skip = (page - 1) * pageSize;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: getPostOrderBy(sort),
      include: publicPostInclude,
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts: posts.map(serializePublicPost),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

async function getPublicPostsByRankedIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const posts = await prisma.post.findMany({
    where: {
      id: { in: ids },
      published: true,
    },
    include: publicPostInclude,
  });

  const postMap = new Map(posts.map((post) => [post.id, serializePublicPost(post)]));

  return ids
    .map((id) => postMap.get(id))
    .filter((post): post is PublicPostCardData => post !== undefined);
}

async function searchPrimaryRows(
  query: string,
  limit: number,
): Promise<SearchRow[]> {
  const containsPattern = `%${query}%`;
  const prefixPattern = `${query}%`;
  const usePgTrgm = await hasPgTrgmSupport();

  if (usePgTrgm) {
    return prisma.$queryRaw<SearchRow[]>`
      SELECT
        p."id",
        (
          CASE
            WHEN lower(p."slug") = lower(${query}) THEN 950
            WHEN lower(p."title") = lower(${query}) THEN 900
            WHEN p."title" ILIKE ${prefixPattern} THEN 760
            WHEN p."slug" ILIKE ${prefixPattern} THEN 720
            WHEN p."title" ILIKE ${containsPattern} THEN 620
            WHEN COALESCE(p."excerpt", '') ILIKE ${containsPattern} THEN 420
            ELSE 0
          END
          + (
            GREATEST(
              similarity(p."title", ${query}),
              similarity(p."slug", ${query}) * 0.95,
              similarity(COALESCE(p."excerpt", ''), ${query}) * 0.75
            ) * 100
          )
        )::double precision AS "score"
      FROM "posts" p
      WHERE p."published" = true
        AND (
          p."title" ILIKE ${containsPattern}
          OR p."slug" ILIKE ${containsPattern}
          OR COALESCE(p."excerpt", '') ILIKE ${containsPattern}
          OR p."title" % ${query}
          OR p."slug" % ${query}
          OR COALESCE(p."excerpt", '') % ${query}
        )
      ORDER BY
        "score" DESC,
        p."publishedAt" DESC NULLS LAST,
        p."createdAt" DESC
      LIMIT ${limit}
    `;
  }

  return prisma.$queryRaw<SearchRow[]>`
    SELECT
      p."id",
      (
        CASE
          WHEN lower(p."slug") = lower(${query}) THEN 950
          WHEN lower(p."title") = lower(${query}) THEN 900
          WHEN p."title" ILIKE ${prefixPattern} THEN 760
          WHEN p."slug" ILIKE ${prefixPattern} THEN 720
          WHEN p."title" ILIKE ${containsPattern} THEN 620
          WHEN COALESCE(p."excerpt", '') ILIKE ${containsPattern} THEN 420
          ELSE 0
        END
      )::double precision AS "score"
    FROM "posts" p
    WHERE p."published" = true
      AND (
        p."title" ILIKE ${containsPattern}
        OR p."slug" ILIKE ${containsPattern}
        OR COALESCE(p."excerpt", '') ILIKE ${containsPattern}
      )
    ORDER BY
      "score" DESC,
      p."publishedAt" DESC NULLS LAST,
      p."createdAt" DESC
    LIMIT ${limit}
  `;
}

async function searchContentRows(
  query: string,
  limit: number,
  excludedIds: string[],
): Promise<SearchRow[]> {
  if (limit <= 0) {
    return [];
  }

  const containsPattern = `%${query}%`;
  const excludedIdsClause =
    excludedIds.length > 0
      ? Prisma.sql`AND p."id" NOT IN (${Prisma.join(excludedIds)})`
      : Prisma.empty;

  return prisma.$queryRaw<SearchRow[]>`
    SELECT
      p."id",
      (
        CASE
          WHEN strpos(lower(p."content"), lower(${query})) > 0 THEN
            GREATEST(200 - LEAST(strpos(lower(p."content"), lower(${query})), 180), 20)
          ELSE 0
        END
      )::double precision AS "score"
    FROM "posts" p
    WHERE p."published" = true
      ${excludedIdsClause}
      AND p."content" ILIKE ${containsPattern}
    ORDER BY
      "score" DESC,
      p."publishedAt" DESC NULLS LAST,
      p."createdAt" DESC
    LIMIT ${limit}
  `;
}

export const getCategorySummary = cache(async (slug: string) => {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
  });
});

export const getPublicCategories = cache(async (): Promise<CategorySummary[]> => {
  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
    },
    orderBy: { name: "asc" },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? undefined,
  }));
});

export const getPublicCategoriesWithCounts = cache(async () => {
  return prisma.category.findMany({
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
  });
});

export const getTagSummary = cache(async (slug: string) => {
  return prisma.tag.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
});

export const getHomePageData = cache(
  async (page: number, sort: PublicPostSort): Promise<HomePageData> => {
    return getPaginatedPosts({ published: true }, page, sort);
  },
);

export const getCategoryPageData = cache(async (slug: string, page: number) => {
  const category = await getCategorySummary(slug);
  if (!category) {
    return null;
  }

  const where: Prisma.PostWhereInput = {
    published: true,
    categoryId: category.id,
  };
  const { posts, pagination } = await getPaginatedPosts(where, page);

  return {
    category,
    posts,
    pagination,
  };
});

export const getTagPageData = cache(async (slug: string, page: number) => {
  const tag = await getTagSummary(slug);
  if (!tag) {
    return null;
  }

  const where: Prisma.PostWhereInput = {
    published: true,
    tags: {
      some: {
        tagId: tag.id,
      },
    },
  };
  const { posts, pagination } = await getPaginatedPosts(where, page);

  return {
    tag,
    posts,
    pagination,
  };
});

export async function searchPublishedPosts(
  query: string,
  limit = 20,
): Promise<PublicPostCardData[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return [];
  }

  const primaryRows = await searchPrimaryRows(trimmedQuery, limit);
  const primaryIds = primaryRows.map((row) => row.id);

  let rankedIds = primaryIds;
  if (primaryIds.length < limit) {
    const contentRows = await searchContentRows(
      trimmedQuery,
      limit - primaryIds.length,
      primaryIds,
    );
    rankedIds = [...primaryIds, ...contentRows.map((row) => row.id)];
  }

  return getPublicPostsByRankedIds(rankedIds);
}

export const getArchivePageData = cache(async (): Promise<{
  archives: ArchiveGroup[];
  total: number;
}> => {
  const posts = await prisma.post.findMany({
    where: {
      published: true,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      publishedAt: true,
      createdAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  const serializedPosts = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
  }));

  const grouped = serializedPosts.reduce(
    (acc: Record<number, Record<number, ArchivePostSummary[]>>, post) => {
      const date = new Date(post.publishedAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      if (!acc[year]) {
        acc[year] = {};
      }

      if (!acc[year][month]) {
        acc[year][month] = [];
      }

      acc[year][month].push(post);
      return acc;
    },
    {},
  );

  const archives: ArchiveGroup[] = Object.entries(grouped)
    .map(([year, months]) => ({
      year: Number.parseInt(year, 10),
      months: Object.entries(months)
        .map(([month, monthPosts]) => ({
          month: Number.parseInt(month, 10),
          posts: monthPosts,
        }))
        .sort((a, b) => b.month - a.month),
    }))
    .sort((a, b) => b.year - a.year);

  return {
    archives,
    total: serializedPosts.length,
  };
});

export function parsePageParam(value?: string) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
