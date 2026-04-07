import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNewCommentNotification } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  getPublicCommentsByPostId,
  getPublicCommentsBySlug,
} from "@/lib/public-comments";

interface CommentRequestBody {
  postId?: string;
  slug?: string;
  author?: string;
  email?: string;
  website?: string;
  content?: string;
  parentId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");
    const slug = searchParams.get("slug");

    if (!postId && !slug) {
      return NextResponse.json(
        { success: false, error: "Missing post identifier" },
        { status: 400 },
      );
    }

    const comments = postId
      ? await getPublicCommentsByPostId(postId)
      : await getPublicCommentsBySlug(slug!);

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = rateLimit(`comment:${ip}`, { window: 60, max: 5 });
    if (!limit.success) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = (await request.json()) as CommentRequestBody;
    const { postId, slug, author, email, website, content, parentId } = body;

    if (!postId && !slug) {
      return NextResponse.json(
        { success: false, error: "Missing post identifier" },
        { status: 400 },
      );
    }

    if (!author || !email || !content) {
      return NextResponse.json(
        { success: false, error: "Author, email, and content are required" },
        { status: 400 },
      );
    }

    let finalPostId = postId ?? null;
    let post:
      | {
          id: string;
          title: string;
          slug: string;
        }
      | null = null;

    if (!finalPostId && slug) {
      post = await prisma.post.findUnique({
        where: { slug },
        select: { id: true, title: true, slug: true },
      });

      if (!post) {
        return NextResponse.json(
          { success: false, error: "Post not found" },
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

    if (!finalPostId) {
      return NextResponse.json(
        { success: false, error: "Post not found" },
        { status: 404 },
      );
    }

    const comment = await prisma.comment.create({
      data: {
        author,
        email,
        website: website || null,
        content,
        postId: finalPostId,
        parentId: parentId || null,
        approved: false,
      },
    });

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
      message: "Comment submitted and waiting for review",
    });
  } catch (error) {
    console.error("Failed to submit comment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit comment" },
      { status: 500 },
    );
  }
}
