import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import PostContent from "./PostContent";
import { calculateReadingTime, renderRichContent } from "@/lib/content";
import { getPublishedPostDetail, type PostDetailData } from "@/lib/posts";

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = "https://blog.vixenahri.cn";
const getPost = cache(getPublishedPostDetail);

function toClientPost(post: PostDetailData) {
  const { content, ...rest } = post;
  void content;
  return rest;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Article not found" };
  }

  const keywords = post.tags.map((tag) => tag.tag.name).join(", ");
  const canonicalUrl = `${SITE_URL}/posts/${post.slug}`;
  const coverImageUrl = post.coverImage
    ? post.coverImage.startsWith("http")
      ? post.coverImage
      : `${SITE_URL}${post.coverImage}`
    : `${SITE_URL}/og-default.png`;

  return {
    title: post.title,
    description: post.excerpt || `${post.title} - VixenAhri Blog`,
    keywords,
    authors: [{ name: post.author.name || "VixenAhri" }],
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
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name || "VixenAhri"],
      section: post.category?.name,
      tags: post.tags.map((tag) => tag.tag.name),
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

  const rendered = renderRichContent(post.content);
  const readingTime = calculateReadingTime(post.content);
  const postForClient = toClientPost(post);
  const coverImageUrl = post.coverImage
    ? post.coverImage.startsWith("http")
      ? post.coverImage
      : `${SITE_URL}${post.coverImage}`
    : `${SITE_URL}/og-default.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || "",
    image: coverImageUrl,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author.name || "VixenAhri",
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
      "@id": `${SITE_URL}/posts/${post.slug}`,
    },
    keywords: post.tags.map((tag) => tag.tag.name).join(", "),
    articleSection: post.category?.name,
    wordCount: post.content.length,
    url: `${SITE_URL}/posts/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostContent
        key={post.id}
        post={postForClient}
        renderedContent={rendered.html}
        toc={rendered.toc}
        readingTime={readingTime}
      />
    </>
  );
}
