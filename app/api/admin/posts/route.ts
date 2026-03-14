import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { getClientInfo, logOperation } from "@/lib/logger";
import { invalidatePostCaches, invalidateTaxonomyCaches } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin";
import { sanitizeRichContent } from "@/lib/content";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: { published?: boolean } = {};
    if (status === "published") {
      where.published = true;
    } else if (status === "draft") {
      where.published = false;
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { name: true, email: true },
        },
        category: {
          select: { id: true, name: true },
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch posts",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const session = admin.session!;
    const body = await request.json();
    const {
      title,
      slug,
      content,
      excerpt,
      coverImage,
      published,
      categoryId,
      tags,
      tagIds,
      seriesId,
      seriesOrder,
      scheduledAt,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: "Title and content are required" },
        { status: 400 },
      );
    }

    const finalSlug = generateSlug(slug || title);
    const existing = await prisma.post.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 },
      );
    }

    const finalTagIds = tagIds || tags || [];
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const shouldPublish = published && !isScheduled;
    const safeContent = sanitizeRichContent(content);

    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        content: safeContent,
        excerpt,
        coverImage,
        published: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        authorId: session.user.id,
        categoryId: categoryId || null,
        seriesId: seriesId || null,
        seriesOrder: seriesOrder || null,
        tags: finalTagIds.length
          ? {
              create: finalTagIds.map((tagId: string) => ({
                tagId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    const { ip, userAgent } = getClientInfo(request);
    await logOperation({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: "create",
      module: "post",
      target: title,
      targetId: post.id,
      ip,
      userAgent,
    });

    invalidatePostCaches([post.slug]);
    invalidateTaxonomyCaches();

    return NextResponse.json({
      success: true,
      data: post,
      message: isScheduled ? "Post scheduled" : "Post created",
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create post",
      },
      { status: 500 },
    );
  }
}
