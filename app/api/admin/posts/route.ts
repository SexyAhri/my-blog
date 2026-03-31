import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientInfo, logOperation } from "@/lib/logger";
import { invalidatePostCaches, invalidateTaxonomyCaches } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin";
import { sanitizeRichContent } from "@/lib/content";
import { parsePostMutationInput } from "@/lib/post-payload";

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
    const parsedInput = parsePostMutationInput(await request.json());

    if (!parsedInput.success) {
      return NextResponse.json(
        { success: false, error: parsedInput.error },
        { status: parsedInput.status },
      );
    }

    const input = parsedInput.data;
    const existing = await prisma.post.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Slug already exists" },
        { status: 400 },
      );
    }

    const safeContent = sanitizeRichContent(input.content);

    const post = await prisma.post.create({
      data: {
        title: input.title,
        slug: input.slug,
        content: safeContent,
        excerpt: input.excerpt,
        coverImage: input.coverImage,
        published: input.shouldPublish,
        publishedAt: input.shouldPublish ? new Date() : null,
        scheduledAt: input.scheduledAt,
        authorId: session.user.id,
        categoryId: input.categoryId,
        seriesId: input.seriesId,
        seriesOrder: input.seriesOrder,
        tags: input.tagIds.length
          ? {
              create: input.tagIds.map((tagId) => ({
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
      target: input.title,
      targetId: post.id,
      ip,
      userAgent,
    });

    invalidatePostCaches([post.slug]);
    invalidateTaxonomyCaches();

    return NextResponse.json({
      success: true,
      data: post,
      message: input.isScheduled ? "Post scheduled" : "Post created",
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
