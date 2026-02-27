import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { cache } from "react";
import PostContent from "./PostContent";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://blog.vixenahri.cn";

// React cache 去重：generateMetadata 和 PostPage 共享同一次查询
const getPost = cache(async (slug: string) => {
  return prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      author: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
    },
  });
});

// 生成动态 SEO 元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "文章不存在" };
  }

  const keywords = post.tags?.map((t) => t.tag.name).join(", ") || "";
  const canonicalUrl = `${SITE_URL}/posts/${slug}`;
  const cover: string | null = post.coverImage ?? null;
  const coverImageUrl = cover
    ? cover.startsWith("http")
      ? cover
      : `${SITE_URL}${cover}`
    : `${SITE_URL}/og-default.png`;

  return {
    title: post.title,
    description: post.excerpt || `${post.title} - VixenAhri Blog`,
    keywords: keywords,
    authors: [{ name: post.author?.name || "VixenAhri" }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || "",
      type: "article",
      url: canonicalUrl,
      siteName: "VixenAhri Blog",
      locale: "zh_CN",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
      authors: [post.author?.name || "VixenAhri"],
      section: post.category?.name,
      tags: post.tags?.map((t) => t.tag.name),
      images: [
        {
          url: coverImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || "",
      images: [coverImageUrl],
      creator: "@VixenAhri",
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // 增加浏览量（不阻塞渲染）
  prisma.post
    .update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  // JSON-LD 结构化数据
  const cover: string | null = post.coverImage ?? null;
  const coverImageUrl = cover
    ? cover.startsWith("http")
      ? cover
      : `${SITE_URL}${cover}`
    : `${SITE_URL}/og-default.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: coverImageUrl,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    author: {
      "@type": "Person",
      name: post.author?.name || "VixenAhri",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "VixenAhri Blog",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/posts/${slug}`,
    },
    keywords: post.tags?.map((t) => t.tag.name).join(", "),
    articleSection: post.category?.name,
    wordCount: post.content?.length || 0,
    url: `${SITE_URL}/posts/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostContent slug={slug} />
    </>
  );
}
