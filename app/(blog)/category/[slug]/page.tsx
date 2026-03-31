"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Empty, Pagination, Spin } from "antd";
import { FolderOutlined } from "@ant-design/icons";
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

interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesResponse {
  success: boolean;
  data: CategorySummary[];
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

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [posts, setPosts] = useState<Post[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const loadCategoryPage = useCallback(async () => {
    if (!slug) {
      setPosts([]);
      setCategoryName("");
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const categoriesRes = await fetch("/api/categories");
      const categoriesData = (await categoriesRes.json()) as CategoriesResponse;

      if (!categoriesData.success) {
        setPosts([]);
        setCategoryName("");
        setTotal(0);
        return;
      }

      const category = categoriesData.data.find((item) => item.slug === slug);

      if (!category) {
        setPosts([]);
        setCategoryName("");
        setTotal(0);
        return;
      }

      setCategoryName(category.name);

      const postsRes = await fetch(
        `/api/posts?categoryId=${category.id}&page=${page}&pageSize=${pageSize}`,
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
      console.error("Failed to load category page:", error);
      setPosts([]);
      setCategoryName("");
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, slug]);

  useEffect(() => {
    void loadCategoryPage();
  }, [loadCategoryPage]);

  return (
    <div className="blog-container">
      <div className="blog-content-inner">
        <div className="blog-posts">
          <div className="category-header">
            <FolderOutlined style={{ fontSize: 32, color: "#722ed1" }} />
            <h1>{categoryName || "Category"}</h1>
            <p>{total} posts</p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 100 }}>
              <Spin size="large" />
            </div>
          ) : posts.length === 0 ? (
            <Empty description="No posts found in this category." />
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
