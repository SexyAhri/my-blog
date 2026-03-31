"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Empty, Pagination, Spin } from "antd";
import { TagOutlined } from "@ant-design/icons";
import PostCard from "@/components/blog/PostCard";
import BlogSidebar from "@/components/blog/BlogSidebar";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  publishedAt: string;
  viewCount: number;
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
}

interface TagSummary {
  id: string;
  name: string;
  slug: string;
}

interface TagsResponse {
  success: boolean;
  data: TagSummary[];
  error?: string;
}

interface PostsResponse {
  success: boolean;
  data: Post[];
  pagination: {
    total: number;
  };
  error?: string;
}

export default function TagPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [posts, setPosts] = useState<Post[]>([]);
  const [tagName, setTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const loadTagPage = useCallback(async () => {
    if (!slug) {
      setPosts([]);
      setTagName("");
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const tagsRes = await fetch("/api/tags");
      const tagsData = (await tagsRes.json()) as TagsResponse;

      if (!tagsData.success) {
        setPosts([]);
        setTagName("");
        setTotal(0);
        return;
      }

      const tag = tagsData.data.find((item) => item.slug === slug);

      if (!tag) {
        setPosts([]);
        setTagName("");
        setTotal(0);
        return;
      }

      setTagName(tag.name);

      const postsRes = await fetch(
        `/api/posts?tagId=${tag.id}&page=${page}&pageSize=${pageSize}`,
      );
      const postsData = (await postsRes.json()) as PostsResponse;

      if (postsData.success) {
        setPosts(postsData.data);
        setTotal(postsData.pagination.total);
      } else {
        setPosts([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("Failed to load tag page:", error);
      setPosts([]);
      setTagName("");
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, slug]);

  useEffect(() => {
    void loadTagPage();
  }, [loadTagPage]);

  return (
    <div className="blog-container">
      <div className="blog-content-inner">
        <div className="blog-posts">
          <div className="category-header">
            <TagOutlined style={{ fontSize: 32, color: "#722ed1" }} />
            <h1>{tagName || "Tag"}</h1>
            <p>{total} posts</p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 100 }}>
              <Spin size="large" />
            </div>
          ) : posts.length === 0 ? (
            <Empty description="No posts found for this tag." />
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {total > pageSize && (
                <div className="blog-pagination">
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={setPage}
                    showSizeChanger={false}
                    showTotal={(count) => `${count} posts`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <aside className="blog-aside">
        <BlogSidebar />
      </aside>
    </div>
  );
}
