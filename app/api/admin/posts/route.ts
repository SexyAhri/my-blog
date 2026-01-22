import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { logOperation, getClientInfo } from "@/lib/logger";

// GET - 获取所有文章
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: any = {};
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
        error: error instanceof Error ? error.message : "获取文章失败",
      },
      { status: 500 },
    );
  }
}

// POST - 创建文章
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

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

    // 检查 slug 是否已存在
    const existing = await prisma.post.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "URL 别名已存在，请使用其他别名" },
        { status: 400 },
      );
    }

    // 支持 tags 或 tagIds 参数
    const finalTagIds = tagIds || tags || [];

    // 处理定时发布
    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    const shouldPublish = published && !isScheduled;

    // 创建文章
    const post = await prisma.post.create({
      data: {
        title,
        slug: finalSlug,
        content,
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

    // 记录操作日志
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

    return NextResponse.json({
      success: true,
      data: post,
      message: isScheduled ? "文章已设置定时发布" : "文章创建成功",
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "创建文章失败",
      },
      { status: 500 },
    );
  }
}
