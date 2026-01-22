import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { visitorId } = await request.json();

    if (!visitorId) {
      return NextResponse.json(
        { success: false, error: "缺少访客ID" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { slug, published: true },
      select: { id: true, likeCount: true },
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 }
      );
    }

    // 检查是否已点赞
    const existingLike = await prisma.postLike.findUnique({
      where: {
        visitorId_postId: {
          visitorId,
          postId: post.id,
        },
      },
    });

    let liked: boolean;
    let likeCount: number;

    if (existingLike) {
      // 取消点赞
      await prisma.postLike.delete({
        where: {
          visitorId_postId: {
            visitorId,
            postId: post.id,
          },
        },
      });
      await prisma.post.update({
        where: { id: post.id },
        data: { likeCount: { decrement: 1 } },
      });
      liked = false;
      likeCount = Math.max(0, (post.likeCount || 0) - 1);
    } else {
      // 点赞
      await prisma.postLike.create({
        data: {
          visitorId,
          postId: post.id,
        },
      });
      await prisma.post.update({
        where: { id: post.id },
        data: { likeCount: { increment: 1 } },
      });
      liked = true;
      likeCount = (post.likeCount || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      liked,
      likeCount,
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 }
    );
  }
}
