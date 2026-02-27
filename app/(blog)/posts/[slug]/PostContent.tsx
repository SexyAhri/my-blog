"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Spin, Tag, Divider, App } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { marked, Renderer } from "marked";

const copyIconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

const renderer = new Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  const language = lang || "";
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  return `<div class="code-block-wrapper">
    <div class="code-block-header">
      <span class="code-block-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </span>
      <button class="code-block-copy" type="button" title="复制代码" aria-label="复制代码">${copyIconSvg}</button>
    </div>
    <pre><code class="language-${language}">${escaped}</code></pre>
  </div>`;
};

marked.setOptions({ renderer, gfm: true, breaks: true });

import Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-docker";

import CommentSection from "@/components/blog/CommentSection";
import PostActions from "@/components/blog/PostActions";
import PostTableOfContents from "@/components/blog/PostTableOfContents";
import ImageModal from "@/components/blog/ImageModal";
import BackToTop from "@/components/blog/BackToTop";

interface PostDetail {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  author: { name: string };
  category?: { name: string; slug: string };
  tags?: Array<{ tag: { name: string; slug: string } }>;
  series?: { id: string; name: string; slug: string };
  seriesOrder?: number;
  prevPost?: { title: string; slug: string };
  nextPost?: { title: string; slug: string };
  relatedPosts?: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    coverImage?: string;
    publishedAt: string;
  }>;
  seriesPosts?: Array<{
    id: string;
    title: string;
    slug: string;
    seriesOrder: number;
  }>;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  return Math.max(1, Math.ceil(text.length / 500));
}

function renderContent(content: string): { html: string; toc: TocItem[] } {
  const tocItems: TocItem[] = [];
  let c = content;

  const isWrappedMarkdown =
    /<p>\s*#{1,6}\s/i.test(c) || /<p>\s*```/.test(c) || /<p>\s*-\s/.test(c);
  if (isWrappedMarkdown) {
    c = c
      .replace(/<p>/gi, "")
      .replace(/<\/p>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();
  }

  c = c.replace(/```([\s\S]*?)```/g, (match, code) => {
    return "```" + code.replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1") + "```";
  });

  const hasRealHtmlStructure =
    /<(h[1-6]|ul|ol|blockquote|pre|table)[^>]*>/i.test(c);
  const looksLikeMarkdown = /^#{1,6}\s/m.test(c) || /```[\s\S]*?```/.test(c);
  const shouldParseAsMarkdown = looksLikeMarkdown && !hasRealHtmlStructure;

  let html = shouldParseAsMarkdown ? (marked(c) as string) : c;

  if (!shouldParseAsMarkdown) {
    html = html.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, code) => {
      return match.replace(code, code.replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1"));
    });
  }

  let headingIndex = 0;
  html = html.replace(/<h([1-3])>(.*?)<\/h\1>/gi, (_, level, text) => {
    const id = `heading-${headingIndex++}`;
    tocItems.push({
      id,
      text: text.replace(/<[^>]*>/g, ""),
      level: parseInt(level),
    });
    return `<h${level} id="${id}">${text}</h${level}>`;
  });

  html = html.replace(/<img /g, '<img loading="lazy" ');

  if (!shouldParseAsMarkdown) {
    html = html.replace(
      /<pre([^>]*)>([\s\S]*?)<\/pre>/gi,
      (_, preAttrs, codeContent) => {
        return `<div class="code-block-wrapper">
        <div class="code-block-header">
          <span class="code-block-dots"><span class="dot dot-red"></span><span class="dot dot-yellow"></span><span class="dot dot-green"></span></span>
          <button class="code-block-copy" type="button" title="复制代码" aria-label="复制代码">${copyIconSvg}</button>
        </div>
        <pre${preAttrs}>${codeContent}</pre>
      </div>`;
      },
    );
  }

  return { html, toc: tocItems };
}

export default function PostContent({ slug }: { slug: string }) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/posts/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPost(data.data);
      })
      .catch((err) => console.error("Failed to load post:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  // 代码高亮
  useEffect(() => {
    if (post?.content) Prism.highlightAll();
  }, [post?.content]);

  // 代码块复制按钮
  useEffect(() => {
    const handleCopy = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".code-block-copy");
      if (!target) return;
      const wrapper = (target as HTMLElement).closest(".code-block-wrapper");
      if (!wrapper) return;
      const codeEl =
        wrapper.querySelector("pre code") || wrapper.querySelector("pre");
      navigator.clipboard
        .writeText(codeEl?.textContent || "")
        .then(() => message.success("已复制到剪贴板"))
        .catch(() => message.error("复制失败"));
    };
    document.addEventListener("click", handleCopy);
    return () => document.removeEventListener("click", handleCopy);
  }, [message]);

  const { renderedContent, toc } = useMemo(() => {
    if (!post?.content) return { renderedContent: "", toc: [] };
    const { html, toc } = renderContent(post.content);
    return { renderedContent: html, toc };
  }, [post?.content]);

  const readingTime = useMemo(() => {
    return post?.content ? calculateReadingTime(post.content) : 0;
  }, [post?.content]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="blog-container">
        <div style={{ textAlign: "center", padding: 100 }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-container">
        <div style={{ textAlign: "center", padding: 100 }}>
          <h2 style={{ marginBottom: 16 }}>文章不存在</h2>
          <Link href="/" style={{ color: "#2563eb" }}>
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="post-detail-wrapper">
        <PostTableOfContents toc={toc} />

        <article className="post-detail">
          {post.coverImage && (
            <div className="post-detail-cover">
              <Image
                src={post.coverImage}
                alt={post.title}
                width={1200}
                height={600}
                style={{ objectFit: "cover" }}
                priority
              />
            </div>
          )}

          <header className="post-detail-header">
            <h1 className="post-detail-title">{post.title}</h1>
            <div className="post-detail-meta">
              <span className="post-detail-meta-item">{post.author.name}</span>
              <span className="post-detail-meta-item">
                {formatDate(post.publishedAt)}
              </span>
              <span className="post-detail-meta-item">
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {readingTime} 分钟阅读
              </span>
              <span className="post-detail-meta-item">
                {post.viewCount} 阅读
              </span>
              {post.category && (
                <span className="post-detail-meta-item">
                  <Link href={`/category/${post.category.slug}`}>
                    {post.category.name}
                  </Link>
                </span>
              )}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="post-detail-tags">
                {post.tags.map((item) => (
                  <Link key={item.tag.slug} href={`/tag/${item.tag.slug}`}>
                    <Tag>{item.tag.name}</Tag>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* 系列文章导航 */}
          {post.series && post.seriesPosts && post.seriesPosts.length > 0 && (
            <div className="post-series-nav">
              <div className="post-series-title">
                📚 系列：
                <Link href={`/series/${post.series.slug}`}>
                  {post.series.name}
                </Link>
              </div>
              <div className="post-series-list">
                {post.seriesPosts.map((p, index) => (
                  <Link
                    key={p.id}
                    href={`/posts/${p.slug}`}
                    className={`post-series-item ${p.id === post.id ? "active" : ""}`}
                  >
                    <span className="post-series-order">{index + 1}</span>
                    <span className="post-series-item-title">{p.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Divider />

          <div
            className="post-detail-content"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          <PostActions
            postId={post.id}
            slug={slug}
            initialLikeCount={post.likeCount || 0}
          />

          {(post.prevPost || post.nextPost) && (
            <div className="post-navigation">
              {post.prevPost ? (
                <Link
                  href={`/posts/${post.prevPost.slug}`}
                  className="post-navigation-item prev"
                >
                  <LeftOutlined />
                  <div>
                    <div className="post-navigation-label">上一篇</div>
                    <div className="post-navigation-title">
                      {post.prevPost.title}
                    </div>
                  </div>
                </Link>
              ) : (
                <div />
              )}
              {post.nextPost && (
                <Link
                  href={`/posts/${post.nextPost.slug}`}
                  className="post-navigation-item next"
                >
                  <div>
                    <div className="post-navigation-label">下一篇</div>
                    <div className="post-navigation-title">
                      {post.nextPost.title}
                    </div>
                  </div>
                  <RightOutlined />
                </Link>
              )}
            </div>
          )}

          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="related-posts">
              <h3>相关文章</h3>
              <div className="related-posts-grid">
                {post.relatedPosts.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/posts/${rp.slug}`}
                    className="related-post-card"
                  >
                    {rp.coverImage && (
                      <div className="related-post-image">
                        <Image
                          src={rp.coverImage}
                          alt={rp.title}
                          width={300}
                          height={150}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="related-post-content">
                      <h4>{rp.title}</h4>
                      {rp.excerpt && <p>{rp.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Divider />
          <CommentSection slug={slug} />
        </article>
      </div>

      <BackToTop />
      <ImageModal />
    </div>
  );
}
