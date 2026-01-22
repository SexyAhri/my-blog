import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - 根据 slug 获取文章详情（前台）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const post = await prisma.post.findUnique({
      where: { slug, published: true },
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
        series: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 },
      );
    }

    // 获取上一篇和下一篇
    const [prevPost, nextPost] = await Promise.all([
      post.publishedAt
        ? prisma.post.findFirst({
            where: {
              published: true,
              publishedAt: { lt: post.publishedAt },
            },
            orderBy: { publishedAt: "desc" },
            select: { id: true, title: true, slug: true },
          })
        : null,
      post.publishedAt
        ? prisma.post.findFirst({
            where: {
              published: true,
              publishedAt: { gt: post.publishedAt },
            },
            orderBy: { publishedAt: "asc" },
            select: { id: true, title: true, slug: true },
          })
        : null,
    ]);

    // 获取相关文章（同分类）
    const relatedPosts = await prisma.post.findMany({
      where: {
        published: true,
        categoryId: post.categoryId,
        NOT: { id: post.id },
      },
      take: 5,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        publishedAt: true,
      },
    });

    // 获取系列文章
    let seriesPosts: any[] = [];
    if (post.seriesId) {
      seriesPosts = await prisma.post.findMany({
        where: {
          seriesId: post.seriesId,
          published: true,
        },
        orderBy: { seriesOrder: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          seriesOrder: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...post,
        prevPost,
        nextPost,
        relatedPosts,
        seriesPosts,
      },
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
