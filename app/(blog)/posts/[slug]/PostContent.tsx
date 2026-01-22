"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Spin, Tag, Divider, App } from "antd";
import {
  LeftOutlined,
  RightOutlined,
  LikeOutlined,
  LikeFilled,
  ShareAltOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  WechatOutlined,
  WeiboOutlined,
  TwitterOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { marked } from "marked";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
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

// 计算阅读时间
function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  const wordCount = text.length;
  return Math.max(1, Math.ceil(wordCount / 500)); // 假设每分钟阅读500字
}

// 获取访客ID
function getVisitorId(): string {
  let visitorId = localStorage.getItem("visitorId");
  if (!visitorId) {
    visitorId = "v_" + Math.random().toString(36).substring(2) + Date.now();
    localStorage.setItem("visitorId", visitorId);
  }
  return visitorId;
}

export default function PostContent({ slug }: { slug: string }) {
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string>("");
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState("");
  const { message } = App.useApp();

  useEffect(() => {
    loadPost();
  }, [slug]);

  // 代码高亮
  useEffect(() => {
    if (post?.content) {
      Prism.highlightAll();
    }
  }, [post?.content]);

  // 检查是否已点赞
  useEffect(() => {
    if (post) {
      const visitorId = getVisitorId();
      const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
      setLiked(!!likedPosts[post.id]);
      setLikeCount(post.likeCount || 0);
    }
  }, [post]);

  // 滚动监听
  useEffect(() => {
    const handleScroll = () => {
      // 目录高亮
      const headings = document.querySelectorAll(
        ".post-detail-content h1, .post-detail-content h2, .post-detail-content h3"
      );
      let currentId = "";
      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        if (rect.top <= 100) {
          currentId = heading.id;
        }
      });
      setActiveId(currentId);

      // 返回顶部按钮
      setShowBackTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 图片点击放大
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" && target.closest(".post-detail-content")) {
        const src = (target as HTMLImageElement).src;
        setCurrentImage(src);
        setImageModalVisible(true);
      }
    };

    document.addEventListener("click", handleImageClick);
    return () => document.removeEventListener("click", handleImageClick);
  }, []);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${slug}`);
      const data = await res.json();
      if (data.success) {
        setPost(data.data);
      }
    } catch (error) {
      console.error("Failed to load post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    const visitorId = getVisitorId();

    try {
      const res = await fetch(`/api/posts/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
        // 保存到本地
        const likedPosts = JSON.parse(localStorage.getItem("likedPosts") || "{}");
        if (data.liked) {
          likedPosts[post.id] = true;
        } else {
          delete likedPosts[post.id];
        }
        localStorage.setItem("likedPosts", JSON.stringify(likedPosts));
      }
    } catch (error) {
      message.error("操作失败");
    }
  };

  const handleShare = (platform: string) => {
    if (!post) return;
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);

    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case "weibo":
        shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${title}`;
        break;
      case "wechat":
        message.info("请截图或复制链接分享到微信");
        return;
      case "copy":
        navigator.clipboard.writeText(window.location.href);
        message.success("链接已复制");
        setShowShareMenu(false);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
    setShowShareMenu(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { renderedContent, toc } = useMemo(() => {
    if (!post?.content) return { renderedContent: "", toc: [] };

    const tocItems: TocItem[] = [];
    const isHtml =
      /<[a-z][\s\S]*>/i.test(post.content) &&
      (post.content.includes("<p>") ||
        post.content.includes("<h") ||
        post.content.includes("<div"));

    let html = isHtml ? post.content : (marked(post.content) as string);

    let headingIndex = 0;
    html = html.replace(/<h([1-3])>(.*?)<\/h\1>/gi, (_, level, text) => {
      const id = `heading-${headingIndex++}`;
      const cleanText = text.replace(/<[^>]*>/g, "");
      tocItems.push({ id, text: cleanText, level: parseInt(level) });
      return `<h${level} id="${id}">${text}</h${level}>`;
    });

    // 给图片添加懒加载
    html = html.replace(/<img /g, '<img loading="lazy" ');

    return { renderedContent: html, toc: tocItems };
  }, [post?.content]);

  const readingTime = useMemo(() => {
    return post?.content ? calculateReadingTime(post.content) : 0;
  }, [post?.content]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 80, behavior: "smooth" });
    }
  };

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
          <Link href="/" style={{ color: "#2563eb" }}>返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="post-detail-wrapper">
        {toc.length > 0 && (
          <aside className="post-toc">
            <div className="post-toc-title">目录</div>
            <nav className="post-toc-nav">
              {toc.map((item) => (
                <a
                  key={item.id}
                  className={`post-toc-item post-toc-level-${item.level} ${activeId === item.id ? "active" : ""}`}
                  onClick={() => scrollToHeading(item.id)}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        )}

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
              <span className="post-detail-meta-item">{formatDate(post.publishedAt)}</span>
              <span className="post-detail-meta-item">
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {readingTime} 分钟阅读
              </span>
              <span className="post-detail-meta-item">{post.viewCount} 阅读</span>
              {post.category && (
                <span className="post-detail-meta-item">
                  <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
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
                📚 系列：<Link href={`/series/${post.series.slug}`}>{post.series.name}</Link>
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

          {/* 点赞和分享 */}
          <div className="post-actions">
            <button
              className={`post-action-btn like-btn ${liked ? "liked" : ""}`}
              onClick={handleLike}
            >
              {liked ? <LikeFilled /> : <LikeOutlined />}
              <span>{likeCount > 0 ? likeCount : "点赞"}</span>
            </button>
            <div className="post-action-share">
              <button
                className="post-action-btn"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <ShareAltOutlined />
                <span>分享</span>
              </button>
              {showShareMenu && (
                <div className="share-menu">
                  <button onClick={() => handleShare("twitter")}>
                    <TwitterOutlined /> Twitter
                  </button>
                  <button onClick={() => handleShare("weibo")}>
                    <WeiboOutlined /> 微博
                  </button>
                  <button onClick={() => handleShare("wechat")}>
                    <WechatOutlined /> 微信
                  </button>
                  <button onClick={() => handleShare("copy")}>
                    <LinkOutlined /> 复制链接
                  </button>
                </div>
              )}
            </div>
          </div>

          {(post.prevPost || post.nextPost) && (
            <div className="post-navigation">
              {post.prevPost ? (
                <Link href={`/posts/${post.prevPost.slug}`} className="post-navigation-item prev">
                  <LeftOutlined />
                  <div>
                    <div className="post-navigation-label">上一篇</div>
                    <div className="post-navigation-title">{post.prevPost.title}</div>
                  </div>
                </Link>
              ) : <div />}
              {post.nextPost && (
                <Link href={`/posts/${post.nextPost.slug}`} className="post-navigation-item next">
                  <div>
                    <div className="post-navigation-label">下一篇</div>
                    <div className="post-navigation-title">{post.nextPost.title}</div>
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
                {post.relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/posts/${relatedPost.slug}`} className="related-post-card">
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
          <CommentSection slug={slug} />
        </article>
      </div>

      {/* 返回顶部 */}
      {showBackTop && (
        <button className="back-to-top" onClick={scrollToTop}>
          <ArrowUpOutlined />
        </button>
      )}

      {/* 图片放大模态框 */}
      {imageModalVisible && (
        <div
          className="image-modal"
          onClick={() => setImageModalVisible(false)}
        >
          <img src={currentImage} alt="放大图片" />
        </div>
      )}
    </div>
  );
}
