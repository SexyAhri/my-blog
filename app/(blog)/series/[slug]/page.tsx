import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-config";

interface Props {
  params: Promise<{ slug: string }>;
}

function toAbsoluteImageUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }

  return value.startsWith("http") ? value : `${SITE_URL}${value}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const series = await prisma.series.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      coverImage: true,
    },
  });

  if (!series) {
    return { title: "Series not found" };
  }

  const coverImageUrl = toAbsoluteImageUrl(series.coverImage);

  return {
    title: `${series.name} Series`,
    description:
      series.description || `Browse all posts in the ${series.name} series.`,
    openGraph: coverImageUrl
      ? {
          images: [
            {
              url: coverImageUrl,
              alt: `${series.name} cover`,
            },
          ],
        }
      : undefined,
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

  const publishedCount = series.posts.length;

  const formatDate = (date: Date | null) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="blog-container">
      <div className="series-page">
        {series.coverImage && (
          <div className="series-cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={series.coverImage} alt={`${series.name} cover`} />
          </div>
        )}

        <div className="page-header">
          <div className="series-eyebrow">Series</div>
          <h1>{series.name}</h1>
          {series.description && <p>{series.description}</p>}
          <p style={{ color: "#888", fontSize: 14 }}>
            {publishedCount} published {publishedCount === 1 ? "post" : "posts"}
          </p>
        </div>

        {publishedCount === 0 ? (
          <div className="series-empty">
            No published posts are available in this series yet.
          </div>
        ) : (
          <div className="series-posts">
            {series.posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="series-post-item"
              >
                <div className="series-post-order">
                  {post.seriesOrder ?? index + 1}
                </div>
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
        )}
      </div>
    </div>
  );
}
