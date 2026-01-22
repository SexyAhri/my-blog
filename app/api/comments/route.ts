import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewCommentNotification } from "@/lib/email";

// GET - 获取文章评论
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const slug = searchParams.get("slug");

    if (!postId && !slug) {
      return NextResponse.json(
        { success: false, error: "缺少文章参数" },
        { status: 400 },
      );
    }

    let whereClause: any = { approved: true };

    if (postId) {
      whereClause.postId = postId;
    } else if (slug) {
      const post = await prisma.post.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!post) {
        return NextResponse.json({ success: true, data: [] });
      }
      whereClause.postId = post.id;
    }

    const comments = await prisma.comment.findMany({
      where: { ...whereClause, parentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        replies: {
          where: { approved: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "获取评论失败" },
      { status: 500 },
    );
  }
}

// POST - 提交评论
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, slug, author, email, website, content, parentId } = body;

    if (!author || !email || !content) {
      return NextResponse.json(
        { success: false, error: "请填写必填字段" },
        { status: 400 },
      );
    }

    let finalPostId = postId;
    let post = null;
    
    if (!finalPostId && slug) {
      post = await prisma.post.findUnique({
        where: { slug },
        select: { id: true, title: true, slug: true },
      });
      if (!post) {
        return NextResponse.json(
          { success: false, error: "文章不存在" },
          { status: 404 },
        );
      }
      finalPostId = post.id;
    } else if (finalPostId) {
      post = await prisma.post.findUnique({
        where: { id: finalPostId },
        select: { id: true, title: true, slug: true },
      });
    }

    const comment = await prisma.comment.create({
      data: {
        author,
        email,
        website: website || null,
        content,
        postId: finalPostId,
        parentId: parentId || null,
        approved: false, // 默认需要审核
      },
    });

    // 发送新评论通知给管理员
    if (post) {
      sendNewCommentNotification({
        postTitle: post.title,
        postSlug: post.slug,
        commenterName: author,
        commenterEmail: email,
        commentContent: content,
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      data: comment,
      message: "评论已提交，等待审核",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "提交评论失败" },
      { status: 500 },
    );
  }
}
