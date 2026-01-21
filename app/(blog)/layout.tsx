import type { Metadata } from "next";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import Analytics from "@/components/blog/Analytics";
import { prisma } from "@/lib/prisma";

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
      metadataBase: new URL(settingsMap.siteUrl || "https://blog.vixenahri.cn"),
      openGraph: {
        title: settingsMap.siteName || "VixenAhri Blog",
        description: settingsMap.siteDescription || "VixenAhri 的个人博客",
        type: "website",
        locale: "zh_CN",
      },
    };
  } catch {
    return {
      title: "VixenAhri Blog",
      description: "VixenAhri 的个人博客",
    };
  }
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="blog-layout">
      <Analytics />
      <BlogHeader />
      <main className="blog-main">{children}</main>
      <BlogFooter />
    </div>
  );
}
