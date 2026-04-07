import type { Metadata } from "next";
import { Empty, Pagination } from "antd";
import { TagOutlined } from "@ant-design/icons";
import { notFound } from "next/navigation";
import PostCard from "@/components/blog/PostCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { getTagPageData, getTagSummary, parsePageParam } from "@/lib/public-posts";
import { SITE_URL } from "@/lib/site-config";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

function getTagPageHref(slug: string, page: number) {
  return page <= 1 ? `/tag/${slug}` : `/tag/${slug}?page=${page}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const page = parsePageParam(query.page);
  const tag = await getTagSummary(slug);

  if (!tag) {
    return {
      title: "Tag not found",
    };
  }

  const canonicalUrl =
    page > 1 ? `${SITE_URL}/tag/${tag.slug}?page=${page}` : `${SITE_URL}/tag/${tag.slug}`;
  const title = page > 1 ? `${tag.name} - Page ${page}` : tag.name;
  const description =
    page > 1
      ? `Browse posts tagged with ${tag.name}, page ${page}.`
      : `Browse all posts tagged with ${tag.name}.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const page = parsePageParam(query.page);
  const data = await getTagPageData(slug, page);

  if (!data) {
    notFound();
  }

  const { tag, posts, pagination } = data;

  if (pagination.totalPages > 0 && page > pagination.totalPages) {
    notFound();
  }

  return (
    <div className="blog-container">
      <div className="blog-content-inner">
        <div className="blog-posts">
          <div className="category-header">
            <TagOutlined style={{ fontSize: 32, color: "#722ed1" }} />
            <h1>{tag.name}</h1>
            <p>{pagination.total} posts</p>
          </div>

          {posts.length === 0 ? (
            <Empty description="No posts found for this tag." />
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {pagination.total > pagination.pageSize && (
                <div className="blog-pagination">
                  <Pagination
                    current={page}
                    total={pagination.total}
                    pageSize={pagination.pageSize}
                    showSizeChanger={false}
                    showTotal={(count) => `${count} posts`}
                    itemRender={(targetPage, type, original) => {
                      if (type === "page") {
                        return <a href={getTagPageHref(tag.slug, targetPage)}>{targetPage}</a>;
                      }

                      if (type === "prev" && page > 1) {
                        return <a href={getTagPageHref(tag.slug, page - 1)}>Prev</a>;
                      }

                      if (type === "next" && page < pagination.totalPages) {
                        return <a href={getTagPageHref(tag.slug, page + 1)}>Next</a>;
                      }

                      return original;
                    }}
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
