import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendCommentReplyNotification } from "@/lib/email";

// PUT - 审核评论
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { approved } = body;

    const comment = await prisma.comment.update({
      where: { id },
      data: { approved },
    });

    // 如果是回复评论且被批准，发送通知给原评论者
    if (approved && comment.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: comment.parentId },
        include: {
          post: { select: { title: true, slug: true } },
        },
      });

      if (parentComment && parentComment.email) {
        sendCommentReplyNotification({
          to: parentComment.email,
          postTitle: parentComment.post.title,
          postSlug: parentComment.post.slug,
          commenterName: parentComment.author,
          commentContent: parentComment.content,
          replyContent: comment.content,
          replyAuthor: comment.author,
        }).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      data: comment,
      message: approved ? "评论已通过" : "评论已拒绝",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "操作失败" },
      { status: 500 },
    );
  }
}

// DELETE - 删除评论
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "未授权" },
        { status: 401 },
      );
    }

    const { id } = await params;

    await prisma.comment.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "评论已删除" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 },
    );
  }
}
