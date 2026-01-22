import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const series = await prisma.series.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });

  if (!series) {
    return { title: "系列不存在" };
  }

  return {
    title: `${series.name} - 系列文章`,
    description: series.description || `${series.name} 系列文章`,
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;

  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { published: true },
        orderBy: { seriesOrder: "asc" },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          seriesOrder: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!series) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="blog-container">
      <div className="series-page">
        <div className="page-header">
          <h1>📚 {series.name}</h1>
          {series.description && <p>{series.description}</p>}
          <p style={{ color: "#888", fontSize: 14 }}>
            共 {series.posts.length} 篇文章
          </p>
        </div>

        <div className="series-posts">
          {series.posts.map((post, index) => (
            <Link
              key={post.id}
              href={`/posts/${post.slug}`}
              className="series-post-item"
            >
              <div className="series-post-order">{index + 1}</div>
              <div className="series-post-content">
                <h3>{post.title}</h3>
                {post.excerpt && <p>{post.excerpt}</p>}
                <span className="series-post-date">
                  {formatDate(post.publishedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
