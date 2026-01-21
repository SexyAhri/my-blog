"use client";

import { useEffect, useState } from "react";
import { Pagination, Spin, Empty } from "antd";
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

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    // 加载每页文章数设置
    fetch("/api/settings/display")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.postsPerPage) {
          setPageSize(parseInt(data.postsPerPage) || 10);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [page, pageSize]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?page=${page}&pageSize=${pageSize}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="blog-container">
      <div className="blog-content">
        {/* Posts */}
        <div className="blog-posts">
          {loading ? (
            <div style={{ textAlign: "center", padding: 80 }}>
              <Spin size="large" />
            </div>
          ) : posts.length === 0 ? (
            <Empty description="暂无文章" />
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {/* Pagination */}
              {total > pageSize && (
                <div className="blog-pagination">
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={setPage}
                    showSizeChanger={false}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <aside className="blog-aside">
          <BlogSidebar />
        </aside>
      </div>
    </div>
  );
}
