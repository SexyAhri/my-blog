import { cache } from "react";
import type { Metadata } from "next";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import Analytics from "@/components/blog/Analytics";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SITE_AUTHOR,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_KEYWORDS,
  DEFAULT_SITE_NAME,
  SITE_URL,
} from "@/lib/site-config";

const getSiteSettings = cache(async () => {
  const settings = await prisma.setting.findMany({
    where: {
      key: {
        in: ["siteName", "siteDescription", "siteKeywords", "siteUrl"],
      },
    },
  });

  const map: Record<string, string> = {};
  settings.forEach((setting) => {
    map[setting.key] = setting.value;
  });

  return map;
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settingsMap = await getSiteSettings();
    const siteName = settingsMap.siteName || DEFAULT_SITE_NAME;
    const siteDescription =
      settingsMap.siteDescription || DEFAULT_SITE_DESCRIPTION;
    const siteUrl = settingsMap.siteUrl || SITE_URL;
    const keywords =
      settingsMap.siteKeywords?.split(",").map((item) => item.trim()).filter(Boolean) ||
      DEFAULT_SITE_KEYWORDS;

    return {
      title: {
        default: siteName,
        template: `%s | ${siteName}`,
      },
      description: siteDescription,
      keywords,
      authors: [{ name: DEFAULT_SITE_AUTHOR }],
      metadataBase: new URL(siteUrl),
      alternates: {
        canonical: siteUrl,
        types: {
          "application/rss+xml": `${siteUrl}/feed.xml`,
        },
      },
      openGraph: {
        title: siteName,
        description: siteDescription,
        type: "website",
        url: siteUrl,
        siteName,
        locale: "zh_CN",
      },
      twitter: {
        card: "summary_large_image",
        title: siteName,
        description: siteDescription,
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
      title: DEFAULT_SITE_NAME,
      description: DEFAULT_SITE_DESCRIPTION,
    };
  }
}

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let siteName = DEFAULT_SITE_NAME;
  let siteDescription = DEFAULT_SITE_DESCRIPTION;

  try {
    const settingsMap = await getSiteSettings();
    siteName = settingsMap.siteName || siteName;
    siteDescription = settingsMap.siteDescription || siteDescription;
  } catch {
    // Fall back to the shared site defaults.
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    description: siteDescription,
    url: SITE_URL,
    author: {
      "@type": "Person",
      name: DEFAULT_SITE_AUTHOR,
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
    name: DEFAULT_SITE_AUTHOR,
    url: SITE_URL,
    sameAs: ["https://github.com/SexyAhri"],
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
