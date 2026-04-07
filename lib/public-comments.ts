import { Prisma } from "@prisma/client";
import { cache, CACHE_TTL } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { getPublicSiteSettings } from "@/lib/public-settings";

const publicReplySelect = Prisma.validator<Prisma.CommentSelect>()({
  id: true,
  author: true,
  content: true,
  createdAt: true,
});

const publicCommentSelect = Prisma.validator<Prisma.CommentSelect>()({
  id: true,
  author: true,
  content: true,
  createdAt: true,
  replies: {
    where: { approved: true },
    orderBy: { createdAt: "asc" },
    select: publicReplySelect,
  },
});

type PublicReplyRecord = Prisma.CommentGetPayload<{
  select: typeof publicReplySelect;
}>;

type PublicCommentRecord = Prisma.CommentGetPayload<{
  select: typeof publicCommentSelect;
}>;

export interface PublicCommentReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface PublicComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  replies?: PublicCommentReply[];
}

export interface PublicCommentSectionData {
  enableComments: boolean;
  comments: PublicComment[];
}

function serializeReply(reply: PublicReplyRecord): PublicCommentReply {
  return {
    id: reply.id,
    author: reply.author,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
  };
}

function serializeComment(comment: PublicCommentRecord): PublicComment {
  return {
    id: comment.id,
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    replies:
      comment.replies.length > 0
        ? comment.replies.map(serializeReply)
        : undefined,
  };
}

async function getPublicComments(
  cacheKey: string,
  where: Prisma.CommentWhereInput,
): Promise<PublicComment[]> {
  return cache.cached(
    cacheKey,
    async () => {
      const comments = await prisma.comment.findMany({
        where: {
          approved: true,
          parentId: null,
          ...where,
        },
        orderBy: { createdAt: "desc" },
        select: publicCommentSelect,
      });

      return comments.map(serializeComment);
    },
    CACHE_TTL.SHORT,
  );
}

export function getPublicCommentsBySlug(slug: string) {
  return getPublicComments(`comments:slug:${slug}`, {
    post: {
      slug,
      published: true,
    },
  });
}

export function getPublicCommentsByPostId(postId: string) {
  return getPublicComments(`comments:post:${postId}`, {
    postId,
    post: {
      published: true,
    },
  });
}

export async function getPublicCommentSectionData(
  slug: string,
): Promise<PublicCommentSectionData> {
  const [settings, comments] = await Promise.all([
    getPublicSiteSettings(),
    getPublicCommentsBySlug(slug),
  ]);

  return {
    enableComments: settings.enableComments,
    comments,
  };
}
