import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ENABLE_COMMENTS,
  DEFAULT_POSTS_PER_PAGE,
} from "@/lib/site-config";

export async function GET() {
  try {
    const [postsPerPage, enableComments] = await Promise.all([
      prisma.setting.findUnique({ where: { key: "postsPerPage" } }),
      prisma.setting.findUnique({ where: { key: "enableComments" } }),
    ]);

    return NextResponse.json({
      success: true,
      postsPerPage: postsPerPage?.value || String(DEFAULT_POSTS_PER_PAGE),
      enableComments:
        enableComments?.value === undefined
          ? DEFAULT_ENABLE_COMMENTS
          : enableComments.value === "true",
    });
  } catch {
    return NextResponse.json({
      success: false,
      postsPerPage: String(DEFAULT_POSTS_PER_PAGE),
      enableComments: DEFAULT_ENABLE_COMMENTS,
    });
  }
}
