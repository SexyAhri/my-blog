import { prisma } from "@/lib/prisma";
import { invalidatePostCaches } from "@/lib/cache";

export interface PublishedPostResult {
  id: string;
  title: string;
  slug: string;
}

export async function publishScheduledPosts(
  now = new Date(),
): Promise<PublishedPostResult[]> {
  const postsToPublish = await prisma.post.findMany({
    where: {
      published: false,
      scheduledAt: {
        lte: now,
        not: null,
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      scheduledAt: true,
    },
  });

  if (postsToPublish.length === 0) {
    return [];
  }

  const results = await prisma.$transaction(
    postsToPublish.map((post) =>
      prisma.post.update({
        where: { id: post.id },
        data: {
          published: true,
          publishedAt: post.scheduledAt ?? now,
          scheduledAt: null,
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
      }),
    ),
  );

  invalidatePostCaches(results.map((post) => post.slug));
  return results;
}