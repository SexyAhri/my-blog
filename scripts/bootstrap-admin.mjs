import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_SITE_DESCRIPTION = "Notes, ideas, and practical builds.";
const DEFAULT_SITE_NAME = "VixenAhri Blog";
const DEFAULT_SITE_KEYWORDS = "blog, tech, notes";
const DEFAULT_SITE_MOTTO = "Notes, ideas, and practical builds.";

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:5177"
  );
}

function getBootstrapSettings() {
  return [
    { key: "siteName", value: process.env.BOOTSTRAP_SITE_NAME || DEFAULT_SITE_NAME },
    {
      key: "siteDescription",
      value: process.env.BOOTSTRAP_SITE_DESCRIPTION || DEFAULT_SITE_DESCRIPTION,
    },
    { key: "siteUrl", value: getSiteUrl() },
    { key: "siteAuthor", value: process.env.ADMIN_NAME || "Admin" },
    {
      key: "siteKeywords",
      value: process.env.BOOTSTRAP_SITE_KEYWORDS || DEFAULT_SITE_KEYWORDS,
    },
    { key: "siteMotto", value: process.env.BOOTSTRAP_SITE_MOTTO || DEFAULT_SITE_MOTTO },
    { key: "postsPerPage", value: process.env.BOOTSTRAP_POSTS_PER_PAGE || "10" },
    {
      key: "enableComments",
      value: process.env.BOOTSTRAP_ENABLE_COMMENTS || "true",
    },
    { key: "enableRss", value: process.env.BOOTSTRAP_ENABLE_RSS || "true" },
    {
      key: "enableSitemap",
      value: process.env.BOOTSTRAP_ENABLE_SITEMAP || "true",
    },
  ];
}

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("[bootstrap] Users already exist, skipping bootstrap.");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminName = process.env.ADMIN_NAME || "Admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me";
  const hashedPassword = await hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: "admin",
    },
  });

  await prisma.setting.createMany({
    data: getBootstrapSettings(),
    skipDuplicates: true,
  });

  console.log(`[bootstrap] Created initial admin user: ${adminEmail}`);
  console.log("[bootstrap] Inserted default site settings.");
}

main()
  .catch((error) => {
    console.error("[bootstrap] Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
