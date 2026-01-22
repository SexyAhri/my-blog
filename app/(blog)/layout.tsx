import type { Metadata } from "next";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import Analytics from "@/components/blog/Analytics";
import { prisma } from "@/lib/prisma";

const SITE_URL = "https://blog.vixenahri.cn";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ["siteName", "siteDescription", "siteKeywords", "siteUrl"],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    const siteUrl = settingsMap.siteUrl || SITE_URL;

    return {
      title: {
        default: settingsMap.siteName || "VixenAhri Blog",
        template: `%s | ${settingsMap.siteName || "VixenAhri Blog"}`,
      },
      description: settingsMap.siteDescription || "VixenAhri 的个人博客",
      keywords: settingsMap.siteKeywords?.split(",") || [
        "博客",
        "技术",
        "分享",
      ],
      authors: [{ name: "VixenAhri" }],
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: siteUrl,
        types: {
          "application/rss+xml": `${siteUrl}/feed.xml`,
        },
      },
      openGraph: {
        title: settingsMap.siteName || "VixenAhri Blog",
        description: settingsMap.siteDescription || "VixenAhri 的个人博客",
        type: "website",
        url: siteUrl,
        siteName: settingsMap.siteName || "VixenAhri Blog",
        locale: "zh_CN",
      },
      twitter: {
        card: "summary_large_image",
        title: settingsMap.siteName || "VixenAhri Blog",
        description: settingsMap.siteDescription || "VixenAhri 的个人博客",
        creator: "@VixenAhri",
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch {
    return {
      title: "VixenAhri Blog",
      description: "VixenAhri 的个人博客",
    };
  }
}

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 获取网站设置用于 JSON-LD
  let siteName = "VixenAhri Blog";
  let siteDescription = "VixenAhri 的个人博客";
  
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["siteName", "siteDescription"] } },
    });
    settings.forEach((s) => {
      if (s.key === "siteName") siteName = s.value;
      if (s.key === "siteDescription") siteDescription = s.value;
    });
  } catch {
    // 使用默认值
  }

  // 网站级别的 JSON-LD 结构化数据
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    description: siteDescription,
    url: SITE_URL,
    author: {
      "@type": "Person",
      name: "VixenAhri",
      url: SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "VixenAhri",
    url: SITE_URL,
    sameAs: [
      "https://github.com/SexyAhri",
    ],
  };

  return (
    <div className="blog-layout">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <Analytics />
      <BlogHeader />
      <main className="blog-main">{children}</main>
      <BlogFooter />
    </div>
  );
}
