"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CategorySummary } from "@/lib/public-posts";

interface CategoryNavClientProps {
  categories: CategorySummary[];
}

export default function CategoryNavClient({
  categories,
}: CategoryNavClientProps) {
  const pathname = usePathname();

  return (
    <nav className="category-nav">
      <div className="category-nav-container">
        <Link
          href="/"
          className={`category-nav-item ${pathname === "/" ? "active" : ""}`}
        >
          All
        </Link>
        {categories.map((category) => {
          const isActive = pathname === `/category/${category.slug}`;
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={`category-nav-item ${isActive ? "active" : ""}`}
            >
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
