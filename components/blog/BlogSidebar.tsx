"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, Spin, Tag } from "antd";
import {
  ClockCircleOutlined,
  FileTextOutlined,
  FireOutlined,
  FolderOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { DEFAULT_SITE_MOTTO } from "@/lib/site-config";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

interface TagItem {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

interface RecentPost {
  id: string;
  title: string;
  slug: string;
  publishedAt: string;
  viewCount?: number;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

interface TagsResponse {
  success: boolean;
  data: TagItem[];
}

interface PostsResponse {
  success: boolean;
  data: RecentPost[];
  pagination?: {
    total: number;
  };
}

interface ProfileResponse {
  success: boolean;
  motto?: string;
  postCount?: number;
  commentCount?: number;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
}

export default function BlogSidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [hotPosts, setHotPosts] = useState<RecentPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [motto, setMotto] = useState(DEFAULT_SITE_MOTTO);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSidebarData = useCallback(async () => {
    try {
      const [categoriesRes, tagsRes, postsRes, hotRes, profileRes] =
        await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
          fetch("/api/posts?pageSize=5"),
          fetch("/api/posts?pageSize=5&sort=hot"),
          fetch("/api/settings/profile"),
        ]);

      const [categoriesData, tagsData, postsData, hotData, profileData] =
        (await Promise.all([
          categoriesRes.json(),
          tagsRes.json(),
          postsRes.json(),
          hotRes.json(),
          profileRes.json(),
        ])) as [
          CategoriesResponse,
          TagsResponse,
          PostsResponse,
          PostsResponse,
          ProfileResponse,
        ];

      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }

      if (tagsData.success) {
        setTags(tagsData.data.slice(0, 15));
      }

      if (postsData.success) {
        setRecentPosts(postsData.data);
        setPostCount(postsData.pagination?.total || postsData.data.length);
      }

      if (hotData.success) {
        setHotPosts(hotData.data);
      }

      if (profileData.success) {
        setPostCount(profileData.postCount || 0);
        setCommentCount(profileData.commentCount || 0);
        setMotto(profileData.motto || DEFAULT_SITE_MOTTO);
        setAvatarUrl(profileData.avatarUrl || null);
        setBannerUrl(profileData.bannerUrl || null);
      }
    } catch (error) {
      console.error("Failed to load sidebar data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSidebarData();
  }, [loadSidebarData]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
    });

  const now = new Date();
  const dayProgress =
    ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
  const weekProgress = ((now.getDay() || 7) / 7) * 100;
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const monthProgress = (now.getDate() / daysInMonth) * 100;
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);
  const yearProgress =
    ((now.getTime() - startOfYear.getTime()) /
      (startOfNextYear.getTime() - startOfYear.getTime())) *
    100;

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin />
      </div>
    );
  }

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

      <Card
        title={
          <span className="sidebar-card-title">
            <ClockCircleOutlined /> Time Progress
          </span>
        }
        className="blog-sidebar-card"
      >
        <div className="sidebar-progress-list">
          <div className="sidebar-progress-item">
            <span>Today</span>
            <div className="sidebar-progress-bar">
              <div
                className="sidebar-progress-fill"
                style={{ width: `${dayProgress}%` }}
              />
            </div>
            <span>{Math.round(dayProgress)}%</span>
          </div>
          <div className="sidebar-progress-item">
            <span>This Week</span>
            <div className="sidebar-progress-bar">
              <div
                className="sidebar-progress-fill"
                style={{ width: `${weekProgress}%` }}
              />
            </div>
            <span>{Math.round(weekProgress)}%</span>
          </div>
          <div className="sidebar-progress-item">
            <span>This Month</span>
            <div className="sidebar-progress-bar">
              <div
                className="sidebar-progress-fill"
                style={{ width: `${monthProgress}%` }}
              />
            </div>
            <span>{Math.round(monthProgress)}%</span>
          </div>
          <div className="sidebar-progress-item">
            <span>This Year</span>
            <div className="sidebar-progress-bar">
              <div
                className="sidebar-progress-fill"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
            <span>{Math.round(yearProgress)}%</span>
          </div>
        </div>
      </Card>

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
                {post.viewCount || 0} views • {formatDate(post.publishedAt)}
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
