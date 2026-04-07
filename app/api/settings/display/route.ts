import { NextResponse } from "next/server";
import { getPublicPostsPerPage } from "@/lib/public-posts";
import { getPublicSiteSettings } from "@/lib/public-settings";
import { DEFAULT_ENABLE_COMMENTS, DEFAULT_POSTS_PER_PAGE } from "@/lib/site-config";

export async function GET() {
  try {
    const [postsPerPage, settings] = await Promise.all([
      getPublicPostsPerPage(),
      getPublicSiteSettings(),
    ]);

    return NextResponse.json({
      success: true,
      postsPerPage: String(postsPerPage),
      enableComments: settings.enableComments,
    });
  } catch {
    return NextResponse.json({
      success: false,
      postsPerPage: String(DEFAULT_POSTS_PER_PAGE),
      enableComments: DEFAULT_ENABLE_COMMENTS,
    });
  }
}
