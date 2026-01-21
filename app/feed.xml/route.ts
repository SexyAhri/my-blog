import { prisma } from "@/lib/prisma";

// 强制动态渲染
export const dynamic = "force-dynamic";

export async function GET() {
  // 检查是否启用 RSS
  const enableRss = await prisma.setting.findUnique({
    where: { key: "enableRss" },
  });

  if (enableRss?.value !== "true") {
    return new Response("RSS feed is disabled", { status: 404 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://blog.vixenahri.cn";

  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      createdAt: true,
      author: { select: { name: true } },
    },
  });

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>VixenAhri Blog</title>
    <link>${baseUrl}</link>
    <description>VixenAhri 的个人博客</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/posts/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || post.content.substring(0, 200)}]]></description>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <author>${post.author?.name || "VixenAhri"}</author>
    </item>`,
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
