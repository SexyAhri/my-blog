import type { Metadata } from "next";
import BlogHeader from "@/components/blog/BlogHeader";
import CategoryNav from "@/components/blog/CategoryNav";
import BlogFooter from "@/components/blog/BlogFooter";
import Analytics from "@/components/blog/Analytics";
import {
  DEFAULT_SITE_AUTHOR,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
  SITE_URL,
} from "@/lib/site-config";
import { getPublicSiteSettings } from "@/lib/public-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getPublicSiteSettings();

    return {
      title: {
        default: settings.siteName,
        template: `%s | ${settings.siteName}`,
      },
      description: settings.siteDescription,
      keywords: settings.siteKeywords,
      authors: [{ name: DEFAULT_SITE_AUTHOR }],
      metadataBase: new URL(settings.siteUrl),
      alternates: {
        canonical: settings.siteUrl,
        types: {
          "application/rss+xml": `${settings.siteUrl}/feed.xml`,
        },
      },
      openGraph: {
        title: settings.siteName,
        description: settings.siteDescription,
        type: "website",
        url: settings.siteUrl,
        siteName: settings.siteName,
        locale: "zh_CN",
      },
      twitter: {
        card: "summary_large_image",
        title: settings.siteName,
        description: settings.siteDescription,
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
  let siteUrl = SITE_URL;

  try {
    const settings = await getPublicSiteSettings();
    siteName = settings.siteName;
    siteDescription = settings.siteDescription;
    siteUrl = settings.siteUrl;
  } catch {
    // Fall back to the shared site defaults.
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    description: siteDescription,
    url: siteUrl,
    author: {
      "@type": "Person",
      name: DEFAULT_SITE_AUTHOR,
      url: siteUrl,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: DEFAULT_SITE_AUTHOR,
    url: siteUrl,
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
      <CategoryNav />
      <main className="blog-main">{children}</main>
      <BlogFooter />
    </div>
  );
}
