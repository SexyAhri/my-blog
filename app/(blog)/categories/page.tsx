import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "antd";
import { FolderOutlined } from "@ant-design/icons";
import { getPublicCategoriesWithCounts } from "@/lib/public-posts";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all categories.",
};

export default async function CategoriesPage() {
  const categories = await getPublicCategoriesWithCounts();

  return (
    <div className="blog-container">
      <div className="page-header">
        <h1>Categories</h1>
        <p>{categories.length} categories</p>
      </div>

      {categories.length === 0 ? (
        <Empty description="No categories yet." />
      ) : (
        <div className="categories-grid">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="category-card"
            >
              <FolderOutlined className="category-icon" />
              <h3>{category.name}</h3>
              <span className="category-count">
                {category._count.posts} posts
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
