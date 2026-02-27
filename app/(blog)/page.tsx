import { Pagination, Empty } from "antd";
import PostCard from "@/components/blog/PostCard";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { prisma } from "@/lib/prisma";
import SortTabs from "@/components/blog/SortTabs";

type SortType = "latest" | "hot" | "liked";

interface Props {
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const sort = (params.sort || "latest") as SortType;

  // 从数据库读取每页条数设置
  let pageSize = 10;
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: "postsPerPage" },
    });
    if (setting?.value) pageSize = parseInt(setting.value) || 10;
  } catch {}

  const skip = (page - 1) * pageSize;

  const orderBy =
    sort === "hot"
      ? [{ viewCount: "desc" as const }, { publishedAt: "desc" as const }]
      : sort === "liked"
        ? [{ likeCount: "desc" as const }, { publishedAt: "desc" as const }]
        : [{ publishedAt: "desc" as const }];

  const where = { published: true };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy,
      include: {
        author: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: {
          include: { tag: { select: { id: true, name: true, slug: true } } },
        },
      },
      skip,
      take: pageSize,
    }),
    prisma.post.count({ where }),
  ]);

  // 序列化日期字段并转换 null -> undefined 以匹配 PostCard 接口
  const serializedPosts = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt ?? undefined,
    coverImage: p.coverImage ?? undefined,
    publishedAt: p.publishedAt?.toISOString() || p.createdAt.toISOString(),
    viewCount: p.viewCount,
    likeCount: p.likeCount,
    author: { name: p.author.name || "" },
    category: p.category ?? undefined,
    tags: p.tags,
  }));

  return (
    <div className="blog-container">
      <div className="blog-content-inner">
        <div className="blog-posts">
          {/* 排序标签 - 客户端交互组件 */}
          <SortTabs currentSort={sort} />

          {/* 文章列表 */}
          {posts.length === 0 ? (
            <Empty description="暂无文章" />
          ) : (
            <>
              <div className="article-list">
                {serializedPosts.map((post) => (
                  <PostCard key={post.id} post={post} variant="standard" />
                ))}
              </div>

              {total > pageSize && (
                <div className="blog-pagination">
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    showSizeChanger={false}
                    itemRender={(p, type, original) => {
                      if (type === "page") {
                        return <a href={`/?page=${p}&sort=${sort}`}>{p}</a>;
                      }
                      if (type === "prev") {
                        return (
                          <a href={`/?page=${page - 1}&sort=${sort}`}>‹</a>
                        );
                      }
                      if (type === "next") {
                        return (
                          <a href={`/?page=${page + 1}&sort=${sort}`}>›</a>
                        );
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
