"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { App, Divider, Tag } from "antd";
import {
  ClockCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from "@ant-design/icons";
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

import BackToTop from "@/components/blog/BackToTop";
import CommentSection from "@/components/blog/CommentSection";
import ImageModal from "@/components/blog/ImageModal";
import PostActions from "@/components/blog/PostActions";
import PostTableOfContents from "@/components/blog/PostTableOfContents";
import type { TocItem } from "@/lib/content";
import type { PostDetailData } from "@/lib/posts";
import { getOrCreateVisitorId, shouldTrackPageView } from "@/lib/visitor";

type ClientPostDetail = Omit<PostDetailData, "content">;

interface PostContentProps {
  post: ClientPostDetail;
  renderedContent: string;
  toc: TocItem[];
  readingTime: number;
}

export default function PostContent({
  post,
  renderedContent,
  toc,
  readingTime,
}: PostContentProps) {
  const [viewCount, setViewCount] = useState(post.viewCount);
  const { message } = App.useApp();

  useEffect(() => {
    Prism.highlightAll();
  }, [renderedContent]);

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
        .then(() => message.success("Copied"))
        .catch(() => message.error("Copy failed"));
    };

    document.addEventListener("click", handleCopy);
    return () => document.removeEventListener("click", handleCopy);
  }, [message]);

  useEffect(() => {
    const path = `/posts/${post.slug}`;
    if (!shouldTrackPageView(path)) {
      return;
    }

    let cancelled = false;

    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path,
        postId: post.id,
        visitorId: getOrCreateVisitorId(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.viewCount === "number") {
          setViewCount(data.viewCount);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [post.id, post.slug]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

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
                {readingTime}
              </span>
              <span className="post-detail-meta-item">{viewCount}</span>
              {post.category && (
                <span className="post-detail-meta-item">
                  <Link href={`/category/${post.category.slug}`}>
                    {post.category.name}
                  </Link>
                </span>
              )}
            </div>
            {post.tags.length > 0 && (
              <div className="post-detail-tags">
                {post.tags.map((item) => (
                  <Link key={item.tag.slug} href={`/tag/${item.tag.slug}`}>
                    <Tag>{item.tag.name}</Tag>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {post.series && post.seriesPosts.length > 0 && (
            <div className="post-series-nav">
              <div className="post-series-title">
                <Link href={`/series/${post.series.slug}`}>{post.series.name}</Link>
              </div>
              <div className="post-series-list">
                {post.seriesPosts.map((item, index) => (
                  <Link
                    key={item.id}
                    href={`/posts/${item.slug}`}
                    className={`post-series-item ${item.id === post.id ? "active" : ""}`}
                  >
                    <span className="post-series-order">{index + 1}</span>
                    <span className="post-series-item-title">{item.title}</span>
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
            slug={post.slug}
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
                    <div className="post-navigation-label">Previous</div>
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
                    <div className="post-navigation-label">Next</div>
                    <div className="post-navigation-title">
                      {post.nextPost.title}
                    </div>
                  </div>
                  <RightOutlined />
                </Link>
              )}
            </div>
          )}

          {post.relatedPosts.length > 0 && (
            <div className="related-posts">
              <h3>Related Posts</h3>
              <div className="related-posts-grid">
                {post.relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.id}
                    href={`/posts/${relatedPost.slug}`}
                    className="related-post-card"
                  >
                    {relatedPost.coverImage && (
                      <div className="related-post-image">
                        <Image
                          src={relatedPost.coverImage}
                          alt={relatedPost.title}
                          width={300}
                          height={150}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    )}
                    <div className="related-post-content">
                      <h4>{relatedPost.title}</h4>
                      {relatedPost.excerpt && <p>{relatedPost.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Divider />
          <CommentSection slug={post.slug} />
        </article>
      </div>

      <BackToTop />
      <ImageModal />
    </div>
  );
}
