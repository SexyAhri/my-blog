import { NextResponse } from "next/server";
import { cache, CACHE_TTL } from "@/lib/cache";
import { getPublishedPostDetail } from "@/lib/posts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const cacheKey = `post:${slug}`;

    const result = await cache.cached(
      cacheKey,
      async () => {
        const post = await getPublishedPostDetail(slug);
        if (!post) {
          return { success: false, error: "Article not found", status: 404 };
        }

        return {
          success: true,
          data: post,
        };
      },
      CACHE_TTL.MEDIUM,
    );

    if (result.status === 404) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 },
      );
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load post",
      },
      { status: 500 },
    );
  }
}