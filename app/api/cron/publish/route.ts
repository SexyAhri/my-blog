import { NextRequest, NextResponse } from "next/server";
import { publishScheduledPosts } from "@/lib/scheduler";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { success: false, error: "Scheduler is not configured" },
        { status: 503 },
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await publishScheduledPosts();

    return NextResponse.json({
      success: true,
      published: results.length,
      posts: results.map((post) => ({ id: post.id, title: post.title })),
    });
  } catch (error) {
    console.error("Cron publish error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish scheduled posts" },
      { status: 500 },
    );
  }
}
