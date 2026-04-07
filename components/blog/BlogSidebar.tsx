import Image from "next/image";
import Link from "next/link";
import { Card, Tag } from "antd";
import {
  FileTextOutlined,
  FireOutlined,
  FolderOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import SidebarTimeProgress from "./SidebarTimeProgress";
import { getBlogSidebarData } from "@/lib/blog-sidebar";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  });
}

export default async function BlogSidebar() {
  const {
    categories,
    tags,
    recentPosts,
    hotPosts,
    postCount,
    commentCount,
    motto,
    avatarUrl,
    bannerUrl,
  } = await getBlogSidebarData();

  return (
    <div className="blog-sidebar">
      <Card className="blog-sidebar-card sidebar-profile">
        <div
          className="sidebar-profile-banner"
          style={
            bannerUrl
              ? {
                  backgroundImage: `url(${bannerUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
        <div className="sidebar-profile-avatar">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={80}
              height={80}
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="sidebar-profile-avatar-icon">V</span>
          )}
        </div>
        <div className="sidebar-profile-content">
          <p className="sidebar-profile-motto">{motto}</p>
          <div className="sidebar-profile-stats">
            <div className="sidebar-profile-stat">
              <span className="sidebar-profile-stat-num">{postCount}</span>
              <span className="sidebar-profile-stat-label">Posts</span>
            </div>
            <div className="sidebar-profile-stat-divider" />
            <div className="sidebar-profile-stat">
              <span className="sidebar-profile-stat-num">
                {commentCount.toLocaleString()}
              </span>
              <span className="sidebar-profile-stat-label">Comments</span>
            </div>
          </div>
        </div>
      </Card>

      <SidebarTimeProgress />

      <Card
        title={
          <span className="sidebar-card-title">
            <FolderOutlined /> Categories
          </span>
        }
        className="blog-sidebar-card"
      >
        <div className="blog-sidebar-list">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="blog-sidebar-item"
            >
              <span>{category.name}</span>
              <span className="blog-sidebar-count">{category._count.posts}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title={
          <span className="sidebar-card-title">
            <FireOutlined /> Hot Posts
          </span>
        }
        className="blog-sidebar-card"
      >
        <div className="blog-sidebar-list">
          {hotPosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="blog-sidebar-item blog-sidebar-hot-item"
            >
              <span className="blog-sidebar-post-title">{post.title}</span>
              <span className="blog-sidebar-date">
                {post.viewCount} views | {formatDate(post.publishedAt)}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title={
          <span className="sidebar-card-title">
            <FileTextOutlined /> Recent Posts
          </span>
        }
        className="blog-sidebar-card"
      >
        <div className="blog-sidebar-list">
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="blog-sidebar-item"
            >
              <span className="blog-sidebar-post-title">{post.title}</span>
              <span className="blog-sidebar-date">{formatDate(post.publishedAt)}</span>
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title={
          <span className="sidebar-card-title">
            <TagsOutlined /> Tags
          </span>
        }
        className="blog-sidebar-card"
      >
        <div className="blog-sidebar-tags">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/tag/${tag.slug}`}>
              <Tag>{tag.name}</Tag>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
