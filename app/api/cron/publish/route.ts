import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 定时发布检查 - 可以通过 cron job 或 Vercel Cron 调用
export async function GET(request: NextRequest) {
  try {
    // 可选：验证 cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 查找所有需要发布的文章
    const postsToPublish = await prisma.post.findMany({
      where: {
        published: false,
        scheduledAt: {
          lte: now,
          not: null,
        },
      },
    });

    // 发布这些文章
    const results = await Promise.all(
      postsToPublish.map((post) =>
        prisma.post.update({
          where: { id: post.id },
          data: {
            published: true,
            publishedAt: post.scheduledAt,
            scheduledAt: null,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      published: results.length,
      posts: results.map((p) => ({ id: p.id, title: p.title })),
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { success: false, error: "发布失败" },
      { status: 500 }
    );
  }
}
