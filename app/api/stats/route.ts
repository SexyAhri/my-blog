import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

const VIEW_DEDUPE_WINDOW_MS = 30 * 60 * 1000;
const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|preview|headless|lighthouse|slurp/i;

function normalizePath(path: unknown): string | null {
  if (typeof path !== "string" || !path.startsWith("/")) {
    return null;
  }

  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }

  return path;
}

function extractPostSlug(path: string): string | null {
  const match = /^\/posts\/([^/?#]+)$/.exec(path);
  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const path = normalizePath(body.path);
    const postId = typeof body.postId === "string" ? body.postId : null;
    if (!path) {
      return NextResponse.json(
        { success: false, error: "Invalid path" },
        { status: 400 },
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    if (BOT_USER_AGENT_PATTERN.test(userAgent)) {
      return NextResponse.json({ success: true, counted: false });
    }

    const ip = getClientIp(request);
    const referer = request.headers.get("referer") || "";
    const dedupeSince = new Date(Date.now() - VIEW_DEDUPE_WINDOW_MS);
    const postSlug = extractPostSlug(path);

    const post = postId
      ? await prisma.post.findUnique({
          where: { id: postId, published: true },
          select: { id: true, viewCount: true },
        })
      : postSlug
        ? await prisma.post.findUnique({
            where: { slug: postSlug, published: true },
            select: { id: true, viewCount: true },
          })
      : null;

    const dedupeKey = `${path}|${ip}|${userAgent}`;

    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${dedupeKey}))`;

      const existing = await tx.pageView.findFirst({
        where: {
          path,
          ip,
          userAgent,
          createdAt: { gte: dedupeSince },
        },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        return { counted: false, viewCount: post?.viewCount };
      }

      await tx.pageView.create({
        data: {
          path,
          postId: post?.id ?? null,
          ip,
          userAgent,
          referer,
        },
      });

      if (!post?.id) {
        return { counted: true, viewCount: null };
      }

      const updatedPost = await tx.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      });

      return { counted: true, viewCount: updatedPost.viewCount };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Stats tracking error:", error);
    return NextResponse.json({ success: true, counted: false });
  }
}
