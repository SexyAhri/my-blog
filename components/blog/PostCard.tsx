import Image from "next/image";
import Link from "next/link";
import { Tag } from "antd";
import { EyeOutlined, LikeOutlined } from "@ant-design/icons";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    coverImage?: string;
    publishedAt: string;
    viewCount: number;
    likeCount?: number;
    author: {
      name: string;
    };
    category?: {
      name: string;
      slug: string;
    };
    tags?: Array<{
      tag: {
        name: string;
        slug: string;
      };
    }>;
  };
  variant?: "featured" | "standard";
}

export default function PostCard({ post, variant = "standard" }: PostCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (variant === "featured") {
    return (
      <article className="post-card post-card-featured">
        <div className="post-card-featured-inner">
          <Link href={`/posts/${post.slug}`} className="post-card-featured-image">
            {post.coverImage ? (
              <Image
                src={post.coverImage}
                alt={post.title}
                width={400}
                height={280}
                sizes="(max-width: 768px) 100vw, 400px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div className="post-card-placeholder" />
            )}
          </Link>
          <div className="post-card-featured-content">
            <span className="post-card-badge">Featured</span>
            <Link href={`/posts/${post.slug}`}>
              <h2 className="post-card-title post-card-title-featured">{post.title}</h2>
            </Link>
            {post.excerpt && (
              <p className="post-card-excerpt post-card-excerpt-featured">{post.excerpt}</p>
            )}
            <div className="post-card-meta post-card-meta-featured">
              <span>{formatDate(post.publishedAt)}</span>
              <span>
                <EyeOutlined /> {post.viewCount} views
              </span>
              {post.likeCount !== undefined && (
                <span>
                  <LikeOutlined /> {post.likeCount} likes
                </span>
              )}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="post-card-tags">
                {post.tags.map((item) => (
                  <Link key={item.tag.slug} href={`/tag/${item.tag.slug}`}>
                    <Tag>{item.tag.name}</Tag>
                  </Link>
                ))}
              </div>
            )}
            <Link href={`/posts/${post.slug}`} className="post-card-readmore">
              Read more -&gt;
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="post-card post-card-standard">
      <div className="post-card-standard-inner">
        <Link href={`/posts/${post.slug}`} className="post-card-standard-image">
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt={post.title}
              width={180}
              height={140}
              sizes="(max-width: 768px) 100vw, 180px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div className="post-card-placeholder post-card-placeholder-sm" />
          )}
        </Link>
        <div className="post-card-standard-content">
          <div className="post-card-meta">
            <span>{post.author.name}</span>
            <span>{formatDate(post.publishedAt)}</span>
            {post.category && (
              <Link href={`/category/${post.category.slug}`}>{post.category.name}</Link>
            )}
          </div>
          <Link href={`/posts/${post.slug}`}>
            <h2 className="post-card-title">{post.title}</h2>
          </Link>
          {post.excerpt && <p className="post-card-excerpt">{post.excerpt}</p>}
          <div className="post-card-footer">
            <span>
              <EyeOutlined /> {post.viewCount}
            </span>
            {post.likeCount !== undefined && (
              <span>
                <LikeOutlined /> {post.likeCount}
              </span>
            )}
            {post.tags && post.tags.length > 0 && (
              <Link href={`/tag/${post.tags[0].tag.slug}`}>
                <Tag>{post.tags[0].tag.name}</Tag>
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
