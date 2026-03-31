"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Empty, Spin } from "antd";
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

interface SearchResponse {
  success: boolean;
  data: Post[];
  error?: string;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const searchPosts = useCallback(async () => {
    if (!query) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = (await res.json()) as SearchResponse;

      if (data.success) {
        setPosts(data.data);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error("Search failed:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void searchPosts();
  }, [searchPosts]);

  if (!query) {
    return (
      <div className="blog-container">
        <div className="blog-content">
          <div className="blog-posts">
            <h1 className="blog-page-title">Search</h1>
            <Empty description="Enter a keyword to search posts." />
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
          <h1 className="blog-page-title">Search: {query}</h1>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : posts.length > 0 ? (
            <>
              <p style={{ color: "#666", marginBottom: 24 }}>
                Found {posts.length} matching posts.
              </p>
              <div className="blog-post-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          ) : (
            <Empty description={`No posts found for "${query}".`} />
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
