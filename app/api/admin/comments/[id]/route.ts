import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCommentReplyNotification } from "@/lib/email";
import { requireAdmin } from "@/lib/admin";
import { invalidateCommentCaches, invalidateSidebarCache } from "@/lib/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();
    if (admin.response) {
      return admin.response;
    }

    const { id } = await params;
    const body = await request.json();
    const { approved } = body;

    const comment = await prisma.comment.update({
      where: { id },
      data: { approved },
    });

    if (approved && comment.parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: comment.parentId },
        include: {
          post: { select: { title: true, slug: true } },
        },
      });

      if (parentComment?.email) {
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

    invalidateCommentCaches();
    invalidateSidebarCache();

    return NextResponse.json({
      success: true,
      data: comment,
      message: approved ? "评论已通过" : "评论已拒绝",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "操作失败" },
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

    const { id } = await params;
    await prisma.comment.delete({ where: { id } });
    invalidateCommentCaches();
    invalidateSidebarCache();

    return NextResponse.json({ success: true, message: "评论已删除" });
  } catch {
    return NextResponse.json(
      { success: false, error: "删除失败" },
      { status: 500 },
    );
  }
}
