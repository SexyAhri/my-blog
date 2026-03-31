export const SETTINGS_LIMITS = {
  siteName: 80,
  siteDescription: 200,
  siteKeywords: 200,
  siteUrl: 300,
  siteAuthor: 80,
  siteEmail: 160,
  siteIcp: 80,
  siteAnalytics: 20000,
  socialGithub: 300,
  socialTwitter: 300,
  socialWeibo: 300,
  socialEmail: 160,
  siteProfileBanner: 500,
  siteMotto: 100,
  siteAvatar: 500,
} as const;

export const POSTS_PER_PAGE_RANGE = {
  min: 1,
  max: 50,
} as const;

export const PROFILE_LIMITS = {
  name: 80,
  passwordMin: 6,
  passwordMax: 128,
  avatar: 500,
} as const;

export const SERIES_LIMITS = {
  name: 80,
  description: 300,
  coverImage: 500,
} as const;

export function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidImageSource(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  return isValidHttpUrl(value);
}
