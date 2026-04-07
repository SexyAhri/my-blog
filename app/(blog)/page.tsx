import { Empty, Pagination } from "antd";
import PostCard from "@/components/blog/PostCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import SortTabs from "@/components/blog/SortTabs";
import {
  getHomePageData,
  parsePageParam,
  type PublicPostSort,
} from "@/lib/public-posts";

interface Props {
  searchParams: Promise<{ page?: string; sort?: string }>;
}

const VALID_SORTS: PublicPostSort[] = ["latest", "hot", "liked"];

function getHomePageHref(page: number, sort: PublicPostSort) {
  return page <= 1 ? `/?sort=${sort}` : `/?page=${page}&sort=${sort}`;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const sort = VALID_SORTS.includes(params.sort as PublicPostSort)
    ? (params.sort as PublicPostSort)
    : "latest";
  const { posts, pagination } = await getHomePageData(page, sort);

  return (
    <div className="blog-container">
      <div className="blog-content-inner">
        <div className="blog-posts">
          <SortTabs currentSort={sort} />

          {posts.length === 0 ? (
            <Empty description="No posts yet." />
          ) : (
            <>
              <div className="article-list">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} variant="standard" />
                ))}
              </div>

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
                        return <a href={getHomePageHref(targetPage, sort)}>{targetPage}</a>;
                      }

                      if (type === "prev" && page > 1) {
                        return <a href={getHomePageHref(page - 1, sort)}>Prev</a>;
                      }

                      if (type === "next" && page < pagination.totalPages) {
                        return <a href={getHomePageHref(page + 1, sort)}>Next</a>;
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
