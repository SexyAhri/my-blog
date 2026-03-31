import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_MOTTO } from "@/lib/site-config";

export async function GET() {
  try {
    const [settings, postCount, commentCount] = await Promise.all([
      prisma.setting.findMany({
        where: {
          key: {
            in: ["siteUrl", "siteMotto", "siteAvatar", "siteProfileBanner"],
          },
        },
      }),
      prisma.post.count({ where: { published: true } }),
      prisma.comment.count({ where: { approved: true } }),
    ]);

    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return NextResponse.json({
      success: true,
      siteUrl: settingsMap.siteUrl || "",
      motto: settingsMap.siteMotto || DEFAULT_SITE_MOTTO,
      postCount,
      commentCount,
      avatarUrl: settingsMap.siteAvatar || null,
      bannerUrl: settingsMap.siteProfileBanner || null,
    });
  } catch {
    return NextResponse.json({
      success: false,
      siteUrl: "",
      motto: DEFAULT_SITE_MOTTO,
      postCount: 0,
      commentCount: 0,
      avatarUrl: null,
      bannerUrl: null,
    });
  }
}
