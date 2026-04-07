import { cache, CACHE_TTL } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ENABLE_COMMENTS,
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_KEYWORDS,
  DEFAULT_SITE_NAME,
  SITE_URL,
} from "@/lib/site-config";

const PUBLIC_SETTING_KEYS = [
  "siteName",
  "siteDescription",
  "siteKeywords",
  "siteUrl",
  "siteAnalytics",
  "socialGithub",
  "socialTwitter",
  "socialWeibo",
  "socialEmail",
  "siteIcp",
  "enableComments",
] as const;

export interface PublicSiteSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string[];
  siteUrl: string;
  siteAnalytics: string | null;
  socialGithub: string | null;
  socialTwitter: string | null;
  socialWeibo: string | null;
  socialEmail: string | null;
  siteIcp: string | null;
  enableComments: boolean;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  return cache.cached(
    "settings:public",
    async () => {
      const settings = await prisma.setting.findMany({
        where: {
          key: {
            in: [...PUBLIC_SETTING_KEYS],
          },
        },
      });

      const map: Record<string, string> = {};
      for (const setting of settings) {
        map[setting.key] = setting.value;
      }

      const keywords = map.siteKeywords
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      return {
        siteName: map.siteName || DEFAULT_SITE_NAME,
        siteDescription: map.siteDescription || DEFAULT_SITE_DESCRIPTION,
        siteKeywords:
          keywords && keywords.length > 0 ? keywords : DEFAULT_SITE_KEYWORDS,
        siteUrl: map.siteUrl || SITE_URL,
        siteAnalytics: map.siteAnalytics || null,
        socialGithub: map.socialGithub || null,
        socialTwitter: map.socialTwitter || null,
        socialWeibo: map.socialWeibo || null,
        socialEmail: map.socialEmail || null,
        siteIcp: map.siteIcp || null,
        enableComments:
          map.enableComments === undefined
            ? DEFAULT_ENABLE_COMMENTS
            : map.enableComments === "true",
      };
    },
    CACHE_TTL.MEDIUM,
  );
}

export function extractGoogleAnalyticsId(code: string | null | undefined) {
  if (!code) {
    return null;
  }

  const match = code.match(/G-[A-Z0-9]+/i);
  return match ? match[0].toUpperCase() : null;
}
