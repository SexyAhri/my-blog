import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCommentReplyNotification } from "@/lib/email";
import { requireAdmin } from "@/lib/admin";

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

    return NextResponse.json({
      success: true,
      data: comment,
      message: approved ? "Comment approved" : "Comment rejected",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Action failed" },
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

    return NextResponse.json({ success: true, message: "Comment deleted" });
  } catch {
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 },
    );
  }
}
