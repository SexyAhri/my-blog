import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { logOperation, getClientInfo } from "@/lib/logger";

// GET - 获取单篇文章
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
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

// PUT - 更新文章
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { id } = await params;
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
        { success: false, error: "标题和内容不能为空" },
        { status: 400 },
      );
    }

    // 生成或验证 slug
    const finalSlug = slug ? generateSlug(slug) : generateSlug(title);

    // 检查 slug 是否被其他文章使用
    const existing = await prisma.post.findFirst({
      where: {
        slug: finalSlug,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "URL 别名已被使用" },
        { status: 400 },
      );
    }

    // 获取当前文章状态
    const currentPost = await prisma.post.findUnique({
      where: { id },
    });

    // 支持 tags 或 tagIds 参数
    const finalTagIds = tagIds || tags || [];

    // 删除现有的标签关联
    await prisma.postTag.deleteMany({
      where: { postId: id },
    });

    // 处理定时发布
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const shouldPublish = published && !isScheduled;

    // 更新文章
    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        slug: finalSlug,
        content,
        excerpt,
        coverImage,
        published: shouldPublish,
        publishedAt:
          shouldPublish && !currentPost?.published
            ? new Date()
            : currentPost?.publishedAt,
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
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
        series: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 记录操作日志
    const { ip, userAgent } = getClientInfo(request);
    await logOperation({
      userId: session.user.id,
      userName: session.user.name || undefined,
      action: "update",
      module: "post",
      target: title,
      targetId: id,
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: post,
      message: isScheduled ? "文章已设置定时发布" : "文章更新成功",
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

// DELETE - 删除文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { id } = await params;

    // 获取文章信息用于日志
    const post = await prisma.post.findUnique({
      where: { id },
      select: { title: true },
    });

    await prisma.post.delete({
      where: { id },
    });

    // 记录操作日志
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

    return NextResponse.json({
      success: true,
      message: "文章删除成功",
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
