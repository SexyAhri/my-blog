import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { searchPublishedPosts } from "@/lib/public-posts";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`search:${ip}`, { window: 60, max: 30 });
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: "Too many search requests. Please try again later." },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const posts = await searchPublishedPosts(query);

    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 },
    );
  }
}
