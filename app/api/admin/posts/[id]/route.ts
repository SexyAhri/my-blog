import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientInfo, logOperation } from "@/lib/logger";
import { invalidatePostCaches, invalidateTaxonomyCaches } from "@/lib/cache";
import { requireAdmin } from "@/lib/admin";
import { sanitizeRichContent } from "@/lib/content";
import { parsePostMutationInput } from "@/lib/post-payload";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
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

    if (!post) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取文章失败",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const session = admin.session!;
    const { id } = await params;
    const parsedInput = parsePostMutationInput(await request.json());

    if (!parsedInput.success) {
      return NextResponse.json(
        { success: false, error: parsedInput.error },
        { status: parsedInput.status },
      );
    }

    const input = parsedInput.data;
    const existing = await prisma.post.findFirst({
      where: {
        slug: input.slug,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "别名已存在" },
        { status: 400 },
      );
    }

    const currentPost = await prisma.post.findUnique({
      where: { id },
      select: {
        published: true,
        publishedAt: true,
        slug: true,
      },
    });

    if (!currentPost) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 },
      );
    }

    const safeContent = sanitizeRichContent(input.content);

    const post = await prisma.$transaction(async (tx) => {
      await tx.postTag.deleteMany({
        where: { postId: id },
      });

      return tx.post.update({
        where: { id },
        data: {
          title: input.title,
          slug: input.slug,
          content: safeContent,
          excerpt: input.excerpt,
          coverImage: input.coverImage,
          published: input.shouldPublish,
          publishedAt:
            input.shouldPublish && !currentPost.published
              ? new Date()
              : currentPost.publishedAt,
          scheduledAt: input.scheduledAt,
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
          series: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    const { ip, userAgent } = getClientInfo(request);
    await logOperation({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: "update",
      module: "post",
      target: input.title,
      targetId: id,
      ip,
      userAgent,
    });

    invalidatePostCaches([currentPost.slug, post.slug]);
    invalidateTaxonomyCaches();

    return NextResponse.json({
      success: true,
      data: post,
      message: input.isScheduled ? "文章已定时发布" : "文章已更新",
    });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "更新文章失败",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const session = admin.session!;
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id },
      select: { title: true, slug: true },
    });

    await prisma.post.delete({
      where: { id },
    });

    const { ip, userAgent } = getClientInfo(request);
    await logOperation({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: "delete",
      module: "post",
      target: post?.title,
      targetId: id,
      ip,
      userAgent,
    });

    invalidatePostCaches([post?.slug]);
    invalidateTaxonomyCaches();

    return NextResponse.json({
      success: true,
      message: "文章已删除",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "删除文章失败",
      },
      { status: 500 },
    );
  }
}
