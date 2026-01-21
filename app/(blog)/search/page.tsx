"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Spin, Empty } from "antd";
import PostCard from "@/components/blog/PostCard";
import BlogSidebar from "@/components/blog/BlogSidebar";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (query) {
      searchPosts();
    } else {
      setLoading(false);
    }
  }, [query]);

  const searchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!query) {
    return (
      <div className="blog-container">
        <div className="blog-content">
          <div className="blog-posts">
            <h1 className="blog-page-title">搜索</h1>
            <Empty description="请输入搜索关键词" />
          </div>
          <aside className="blog-aside">
            <BlogSidebar />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-container">
      <div className="blog-content">
        <div className="blog-posts">
          <h1 className="blog-page-title">搜索：{query}</h1>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : posts.length > 0 ? (
            <>
              <p style={{ color: "#666", marginBottom: 24 }}>
                找到 {posts.length} 篇相关文章
              </p>
              <div className="blog-post-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          ) : (
            <Empty description={`没有找到与"${query}"相关的文章`} />
          )}
        </div>
        <aside className="blog-aside">
          <BlogSidebar />
        </aside>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
