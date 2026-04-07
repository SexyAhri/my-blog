import type { Metadata } from "next";
import { Empty } from "antd";
import PostCard from "@/components/blog/PostCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { searchPublishedPosts } from "@/lib/public-posts";
import { SITE_URL } from "@/lib/site-config";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const canonicalUrl = query
    ? `${SITE_URL}/search?q=${encodeURIComponent(query)}`
    : `${SITE_URL}/search`;

  return {
    title: query ? `Search: ${query}` : "Search",
    description: query
      ? `Search results for "${query}".`
      : "Search published posts.",
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const shouldSearch = query.length >= 2;
  const posts = shouldSearch ? await searchPublishedPosts(query) : [];

  return (
    <div className="blog-container">
      <div className="blog-content">
        <div className="blog-posts">
          <h1 className="blog-page-title">
            {query ? `Search: ${query}` : "Search"}
          </h1>

          {!query ? (
            <Empty description="Enter a keyword to search posts." />
          ) : !shouldSearch ? (
            <Empty description="Enter at least 2 characters to search." />
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
