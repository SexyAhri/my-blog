import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.postLike.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.series.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.media.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.pageView.deleteMany();
  await prisma.dailyStat.deleteMany();
  await prisma.operationLog.deleteMany();
  await prisma.loginLog.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log("Resetting database...");
  await resetDatabase();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminName = process.env.ADMIN_NAME || "Admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await hash(adminPassword, 12);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  const [techCategory, lifeCategory, projectsCategory] = await Promise.all([
    prisma.category.create({
      data: {
        name: "Tech",
        slug: "tech",
        description: "Engineering notes, architecture decisions, and tooling.",
      },
    }),
    prisma.category.create({
      data: {
        name: "Life",
        slug: "life",
        description: "Small lessons, reflections, and everyday notes.",
      },
    }),
    prisma.category.create({
      data: {
        name: "Projects",
        slug: "projects",
        description: "Build logs, shipping notes, and product updates.",
      },
    }),
  ]);

  const [nextTag, reactTag, typescriptTag, dockerTag, postgresTag, prismaTag] =
    await Promise.all([
      prisma.tag.create({ data: { name: "Next.js", slug: "nextjs" } }),
      prisma.tag.create({ data: { name: "React", slug: "react" } }),
      prisma.tag.create({ data: { name: "TypeScript", slug: "typescript" } }),
      prisma.tag.create({ data: { name: "Docker", slug: "docker" } }),
      prisma.tag.create({ data: { name: "PostgreSQL", slug: "postgresql" } }),
      prisma.tag.create({ data: { name: "Prisma", slug: "prisma" } }),
    ]);

  const blogSeries = await prisma.series.create({
    data: {
      name: "Building This Blog",
      slug: "building-this-blog",
      description:
        "Notes from shaping the blog, the admin tools, and the publishing workflow.",
    },
  });

  const now = Date.now();

  await Promise.all([
    prisma.post.create({
      data: {
        title: "Welcome to the blog",
        slug: "welcome",
        excerpt:
          "A quick introduction to what this site is for and what kinds of notes will live here.",
        content: `
<h2>Welcome</h2>
<p>This blog is a place for practical notes, project write-ups, and small lessons collected while building on the web.</p>
<p>The public site is paired with an admin workspace for writing, scheduling, media management, and settings.</p>
<h3>What to expect</h3>
<ul>
  <li>Clear technical write-ups</li>
  <li>Project retrospectives</li>
  <li>Useful snippets and implementation notes</li>
</ul>
`,
        published: true,
        publishedAt: new Date(now),
        viewCount: 100,
        authorId: admin.id,
        categoryId: techCategory.id,
        seriesId: blogSeries.id,
        seriesOrder: 1,
        tags: {
          create: [{ tagId: nextTag.id }, { tagId: reactTag.id }],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "Deploying the app with Docker Compose",
        slug: "deploying-with-docker-compose",
        excerpt:
          "A compact checklist for packaging the app, connecting PostgreSQL, and running it in production.",
        content: `
<h2>Why Docker Compose</h2>
<p>Compose makes it easy to keep the app, database settings, and optional sidecars aligned in one place.</p>
<h3>Core steps</h3>
<ol>
  <li>Set environment variables for auth, database access, and the public site URL.</li>
  <li>Start the stack with <code>docker compose up -d</code>.</li>
  <li>Initialize the database with the Prisma scripts.</li>
</ol>
<p>That gives you a repeatable deployment story with less manual setup.</p>
`,
        published: true,
        publishedAt: new Date(now - 1000 * 60 * 60 * 24),
        viewCount: 56,
        authorId: admin.id,
        categoryId: projectsCategory.id,
        seriesId: blogSeries.id,
        seriesOrder: 2,
        tags: {
          create: [{ tagId: dockerTag.id }, { tagId: nextTag.id }],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "Why Prisma fits this blog",
        slug: "why-prisma-fits-this-blog",
        excerpt:
          "A short note on using Prisma for schema clarity, safer queries, and easier maintenance.",
        content: `
<h2>Prisma as the data layer</h2>
<p>For this project, Prisma keeps the schema readable and the application code predictable.</p>
<p>The types generated from the schema help keep admin mutations and public reads aligned.</p>
<h3>Benefits here</h3>
<ul>
  <li>Clear relations for posts, tags, comments, series, media, and settings</li>
  <li>Safe refactors when the admin surface grows</li>
  <li>Easy local iteration with Prisma Studio and db push</li>
</ul>
`,
        published: true,
        publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
        viewCount: 89,
        authorId: admin.id,
        categoryId: techCategory.id,
        tags: {
          create: [
            { tagId: prismaTag.id },
            { tagId: postgresTag.id },
            { tagId: typescriptTag.id },
          ],
        },
      },
    }),
    prisma.post.create({
      data: {
        title: "Notes outside the editor",
        slug: "notes-outside-the-editor",
        excerpt:
          "Not every useful note is a full article. Some are just short reminders worth keeping.",
        content: `
<h2>Small notes matter</h2>
<p>Some of the best project improvements come from small observations made between bigger tasks.</p>
<p>This section of the blog is for short reflections, maintenance notes, and practical reminders.</p>
`,
        published: true,
        publishedAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
        viewCount: 24,
        authorId: admin.id,
        categoryId: lifeCategory.id,
        tags: {
          create: [{ tagId: reactTag.id }],
        },
      },
    }),
  ]);

  await Promise.all([
    prisma.setting.create({
      data: { key: "siteName", value: "VixenAhri Blog" },
    }),
    prisma.setting.create({
      data: {
        key: "siteDescription",
        value: "Notes, ideas, and practical builds.",
      },
    }),
    prisma.setting.create({
      data: { key: "siteUrl", value: "https://blog.vixenahri.cn" },
    }),
    prisma.setting.create({
      data: { key: "siteAuthor", value: "VixenAhri" },
    }),
    prisma.setting.create({
      data: { key: "siteKeywords", value: "blog, tech, notes" },
    }),
    prisma.setting.create({
      data: { key: "siteMotto", value: "Notes, ideas, and practical builds." },
    }),
    prisma.setting.create({
      data: { key: "postsPerPage", value: "10" },
    }),
    prisma.setting.create({
      data: { key: "enableComments", value: "true" },
    }),
    prisma.setting.create({
      data: { key: "enableRss", value: "true" },
    }),
    prisma.setting.create({
      data: { key: "enableSitemap", value: "true" },
    }),
  ]);

  console.log("Seed completed successfully.");
  console.log(`Admin login: ${adminEmail}`);
  console.log("Password: value from ADMIN_PASSWORD");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
