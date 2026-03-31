export const SITE_URL = "https://blog.vixenahri.cn";
export const DEFAULT_SITE_NAME = "VixenAhri Blog";
export const DEFAULT_SITE_DESCRIPTION = "Notes, ideas, and practical builds.";
export const DEFAULT_SITE_KEYWORDS = ["blog", "tech", "notes"];
export const DEFAULT_SITE_AUTHOR = "VixenAhri";
export const DEFAULT_SITE_MOTTO = "Notes, ideas, and practical builds.";
export const DEFAULT_POSTS_PER_PAGE = 10;
export const DEFAULT_ENABLE_COMMENTS = true;
export const DEFAULT_ENABLE_RSS = true;
export const DEFAULT_ENABLE_SITEMAP = true;

export const DEFAULT_ADMIN_SETTINGS = {
  siteName: DEFAULT_SITE_NAME,
  siteDescription: DEFAULT_SITE_DESCRIPTION,
  siteKeywords: DEFAULT_SITE_KEYWORDS.join(", "),
  siteUrl: "",
  siteAuthor: "",
  siteEmail: "",
  siteIcp: "",
  siteAnalytics: "",
  postsPerPage: DEFAULT_POSTS_PER_PAGE,
  enableComments: DEFAULT_ENABLE_COMMENTS,
  enableRss: DEFAULT_ENABLE_RSS,
  enableSitemap: DEFAULT_ENABLE_SITEMAP,
  socialGithub: "",
  socialTwitter: "",
  socialWeibo: "",
  socialEmail: "",
  siteProfileBanner: "",
  siteMotto: DEFAULT_SITE_MOTTO,
  siteAvatar: "",
} as const;
