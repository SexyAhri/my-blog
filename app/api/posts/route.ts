import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cache, CACHE_TTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const categoryId = searchParams.get("categoryId");
    const tagId = searchParams.get("tagId");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "latest";

    const cacheKey = `posts:${page}:${pageSize}:${categoryId || ""}:${tagId || ""}:${search || ""}:${sort}`;

    const result = await cache.cached(
      cacheKey,
      async () => {
        const skip = (page - 1) * pageSize;
        const where: Prisma.PostWhereInput = {
          published: true,
        };

        if (categoryId) {
          where.categoryId = categoryId;
        }

        if (tagId) {
          where.tags = {
            some: {
              tagId,
            },
          };
        }

        if (search) {
          where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
            { excerpt: { contains: search, mode: "insensitive" } },
          ];
        }

        const orderBy: Prisma.PostOrderByWithRelationInput[] =
          sort === "hot"
            ? [{ viewCount: "desc" }, { publishedAt: "desc" }]
            : sort === "liked"
              ? [{ likeCount: "desc" }, { publishedAt: "desc" }]
              : [{ publishedAt: "desc" }];

        const [posts, total] = await Promise.all([
          prisma.post.findMany({
            where,
            orderBy,
            include: {
              author: {
                select: { id: true, name: true, email: true },
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
            },
            skip,
            take: pageSize,
          }),
          prisma.post.count({ where }),
        ]);

        return {
          success: true,
          data: posts,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        };
      },
      CACHE_TTL.SHORT,
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch posts",
      },
      { status: 500 },
    );
  }
}
