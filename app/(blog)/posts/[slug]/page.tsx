import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PostContent from "./PostContent";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://blog.vixenahri.cn";

// 生成动态 SEO 元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      updatedAt: true,
      author: { select: { name: true } },
      tags: { include: { tag: true } },
      category: { select: { name: true } },
    },
  });

  if (!post) {
    return { title: "文章不存在" };
  }

  const keywords = post.tags?.map((t) => t.tag.name).join(", ") || "";
  const canonicalUrl = `${SITE_URL}/posts/${slug}`;
  const coverImageUrl = post.coverImage 
    ? (post.coverImage.startsWith("http") ? post.coverImage : `${SITE_URL}${post.coverImage}`)
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

  // 获取完整文章数据用于 JSON-LD
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      author: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!post) {
    notFound();
  }

  // 增加浏览量
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  // JSON-LD 结构化数据
  const coverImageUrl = post.coverImage 
    ? (post.coverImage.startsWith("http") ? post.coverImage : `${SITE_URL}${post.coverImage}`)
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
