import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "antd";
import { getArchivePageData } from "@/lib/public-posts";

export const metadata: Metadata = {
  title: "Archive",
  description: "Browse the full post archive by year and month.",
};

function getMonthName(month: number) {
  return new Date(2024, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function ArchivePage() {
  const { archives, total } = await getArchivePageData();

  return (
    <div className="blog-container">
      <div className="page-header">
        <h1>Archive</h1>
        <p>{total} posts</p>
      </div>

      {archives.length === 0 ? (
        <Empty description="No posts yet." />
      ) : (
        <div className="archive-list">
          {archives.map((yearGroup) => (
            <div key={yearGroup.year} className="archive-year">
              <h2 className="archive-year-title">{yearGroup.year}</h2>
              {yearGroup.months.map((monthGroup) => (
                <div key={monthGroup.month} className="archive-month">
                  <h3 className="archive-month-title">
                    {getMonthName(monthGroup.month)}
                    <span className="archive-month-count">
                      ({monthGroup.posts.length})
                    </span>
                  </h3>
                  <ul className="archive-posts">
                    {monthGroup.posts.map((post) => (
                      <li key={post.id}>
                        <span className="archive-post-date">
                          {formatDate(post.publishedAt)}
                        </span>
                        <Link
                          href={`/posts/${post.slug}`}
                          className="archive-post-title"
                        >
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
