import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

const ANALYTICS_TIME_ZONE = process.env.ANALYTICS_TIME_ZONE || "Asia/Shanghai";

function toNumber(value: bigint | number | null | undefined): number {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value ?? 0;
}

function formatDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7", 10);
    const dayOffset = Math.max(days - 1, 0);

    const [
      totalViewsResult,
      uniqueVisitorsResult,
      referersResult,
      topPostViewsResult,
      dailyStatsResult,
    ] = await Promise.all([
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM "page_views"
        WHERE timezone(${ANALYTICS_TIME_ZONE}, "createdAt")::date >=
          timezone(${ANALYTICS_TIME_ZONE}, NOW())::date - ${dayOffset}
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT ip)::bigint AS count
        FROM "page_views"
        WHERE timezone(${ANALYTICS_TIME_ZONE}, "createdAt")::date >=
          timezone(${ANALYTICS_TIME_ZONE}, NOW())::date - ${dayOffset}
          AND ip IS NOT NULL
          AND ip <> ''
      `,
      prisma.$queryRaw<Array<{ referer: string; count: bigint }>>`
        SELECT referer, COUNT(*)::bigint AS count
        FROM "page_views"
        WHERE timezone(${ANALYTICS_TIME_ZONE}, "createdAt")::date >=
          timezone(${ANALYTICS_TIME_ZONE}, NOW())::date - ${dayOffset}
          AND referer IS NOT NULL
          AND referer <> ''
        GROUP BY referer
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.$queryRaw<Array<{ postId: string; count: bigint }>>`
        SELECT "postId" AS "postId", COUNT(*)::bigint AS count
        FROM "page_views"
        WHERE timezone(${ANALYTICS_TIME_ZONE}, "createdAt")::date >=
          timezone(${ANALYTICS_TIME_ZONE}, NOW())::date - ${dayOffset}
          AND "postId" IS NOT NULL
        GROUP BY "postId"
        ORDER BY count DESC
        LIMIT 10
      `,
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT TO_CHAR(timezone(${ANALYTICS_TIME_ZONE}, "createdAt")::date, 'YYYY-MM-DD') AS date,
          COUNT(*)::bigint AS count
        FROM "page_views"
        WHERE timezone(${ANALYTICS_TIME_ZONE}, "createdAt")::date >=
          timezone(${ANALYTICS_TIME_ZONE}, NOW())::date - ${dayOffset}
        GROUP BY 1
        ORDER BY 1 DESC
      `,
    ]);

    const topPostIds = topPostViewsResult.map((item) => item.postId);
    const topPostMetadata = topPostIds.length
      ? await prisma.post.findMany({
          where: { id: { in: topPostIds } },
          select: {
            id: true,
            title: true,
            slug: true,
          },
        })
      : [];

    const topPostMap = new Map(topPostMetadata.map((item) => [item.id, item]));
    const topPosts = topPostViewsResult
      .map((item) => {
        const post = topPostMap.get(item.postId);
        if (!post) {
          return null;
        }

        return {
          id: post.id,
          title: post.title,
          slug: post.slug,
          viewCount: toNumber(item.count),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const dailyStatsMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyStatsMap.set(formatDateKey(date), 0);
    }

    for (const row of dailyStatsResult) {
      dailyStatsMap.set(row.date, toNumber(row.count));
    }

    return NextResponse.json({
      success: true,
      data: {
        totalViews: toNumber(totalViewsResult[0]?.count),
        uniqueVisitors: toNumber(uniqueVisitorsResult[0]?.count),
        topPosts,
        referers: referersResult.map((referer) => ({
          referer: referer.referer,
          count: toNumber(referer.count),
        })),
        dailyStats: Array.from(dailyStatsMap, ([date, count]) => ({
          date,
          count,
        })),
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}