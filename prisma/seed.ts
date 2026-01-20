import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("开始初始化数据...");

  // 清空现有数据
  await prisma.postTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 创建管理员用户
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = await hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || "admin@example.com",
      name: process.env.ADMIN_NAME || "Admin",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("✓ 管理员用户创建成功:", admin.name);

  // 创建分类
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: "技术", slug: "tech", description: "技术文章与教程" },
    }),
    prisma.category.create({
      data: { name: "生活", slug: "life", description: "生活随笔与感悟" },
    }),
    prisma.category.create({
      data: { name: "项目", slug: "projects", description: "个人项目展示" },
    }),
  ]);
  console.log("✓ 分类创建成功:", categories.length, "个");

  // 创建标签
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: "Next.js", slug: "nextjs" } }),
    prisma.tag.create({ data: { name: "React", slug: "react" } }),
    prisma.tag.create({ data: { name: "TypeScript", slug: "typescript" } }),
    prisma.tag.create({ data: { name: "Docker", slug: "docker" } }),
    prisma.tag.create({ data: { name: "PostgreSQL", slug: "postgresql" } }),
    prisma.tag.create({ data: { name: "Prisma", slug: "prisma" } }),
  ]);
  console.log("✓ 标签创建成功:", tags.length, "个");

  // 创建文章
  const posts = await Promise.all([
    // 欢迎文章
    prisma.post.create({
      data: {
        title: "欢迎来到我的博客",
        slug: "welcome",
        excerpt: "你好，我是 VixenAhri，欢迎来到我的个人博客！",
        content: `<h2>👋 欢迎来到 VixenAhri 的博客</h2>
<p>你好，我是 <strong>VixenAhri</strong>，欢迎来到我的个人博客！</p>
<p>这是一个使用现代技术栈构建的博客系统，在这里我会分享技术文章、生活感悟和个人思考。</p>
<hr>
<h3>🎯 关于这个博客</h3>
<p>这个博客系统是我从零开始搭建的，主要用于：</p>
<ul>
<li>📝 记录学习笔记和技术心得</li>
<li>💡 分享开发经验和最佳实践</li>
<li>🎨 展示个人项目和作品</li>
<li>💬 与志同道合的朋友交流</li>
</ul>
<h3>✨ 功能特性</h3>
<p><strong>前台展示</strong></p>
<ul>
<li>文章浏览 - 支持分类、标签筛选</li>
<li>文章目录 - 自动生成，滚动高亮</li>
<li>评论系统 - 支持访客评论</li>
<li>全文搜索 - 快速找到想要的内容</li>
<li>RSS 订阅 - 订阅获取最新文章</li>
</ul>
<p><strong>后台管理</strong></p>
<ul>
<li>仪表盘 - 数据统计一目了然</li>
<li>文章管理 - 富文本编辑器</li>
<li>媒体库 - 图片上传和管理</li>
<li>评论管理 - 审核和回复评论</li>
</ul>
<h3>🛠️ 技术栈</h3>
<ul>
<li>框架：Next.js 16</li>
<li>语言：TypeScript</li>
<li>UI：Ant Design 5</li>
<li>数据库：PostgreSQL + Prisma</li>
<li>部署：Docker</li>
</ul>
<hr>
<p>感谢你的访问，希望这里的内容对你有所帮助！🎉</p>`,
        published: true,
        publishedAt: new Date(),
        viewCount: 100,
        authorId: admin.id,
        categoryId: categories[0].id,
        tags: {
          create: [{ tagId: tags[0].id }, { tagId: tags[1].id }],
        },
      },
    }),

    // 技术文章
    prisma.post.create({
      data: {
        title: "使用 Docker 部署 Next.js 应用",
        slug: "deploy-nextjs-with-docker",
        excerpt:
          "本文介绍如何使用 Docker 容器化部署 Next.js 应用，包括 Dockerfile 编写和 docker-compose 配置。",
        content: `<h2>前言</h2>
<p>Docker 是现代应用部署的标准方式，本文将介绍如何将 Next.js 应用容器化部署。</p>
<h2>准备工作</h2>
<ul>
<li>安装 Docker 和 Docker Compose</li>
<li>一个 Next.js 项目</li>
</ul>
<h2>编写 Dockerfile</h2>
<p>创建多阶段构建的 Dockerfile：</p>
<pre><code>FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]</code></pre>
<h2>配置 docker-compose</h2>
<p>创建 docker-compose.yml 文件来管理容器：</p>
<pre><code>version: "3.8"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://...
    restart: unless-stopped</code></pre>
<h2>部署</h2>
<p>运行以下命令启动服务：</p>
<pre><code>docker compose up -d</code></pre>
<h2>总结</h2>
<p>使用 Docker 部署 Next.js 应用可以确保环境一致性，方便扩展和维护。</p>`,
        published: true,
        publishedAt: new Date(Date.now() - 86400000),
        viewCount: 56,
        authorId: admin.id,
        categoryId: categories[0].id,
        tags: {
          create: [{ tagId: tags[0].id }, { tagId: tags[3].id }],
        },
      },
    }),

    // 项目文章
    prisma.post.create({
      data: {
        title: "个人博客系统开发总结",
        slug: "blog-development-summary",
        excerpt: "分享这个博客系统的开发过程、技术选型和遇到的问题。",
        content: `<h2>项目背景</h2>
<p>一直想有一个自己的博客，于是决定从零开始搭建一个现代化的博客系统。</p>
<h2>技术选型</h2>
<h3>前端框架</h3>
<p>选择 <strong>Next.js 16</strong>，原因：</p>
<ul>
<li>App Router 提供更好的路由体验</li>
<li>服务端渲染对 SEO 友好</li>
<li>React 生态丰富</li>
</ul>
<h3>UI 组件库</h3>
<p>选择 <strong>Ant Design 5</strong>，原因：</p>
<ul>
<li>组件丰富，开箱即用</li>
<li>设计规范统一</li>
<li>支持主题定制</li>
</ul>
<h3>数据库</h3>
<p>选择 <strong>PostgreSQL + Prisma</strong>，原因：</p>
<ul>
<li>PostgreSQL 稳定可靠</li>
<li>Prisma 提供类型安全的数据库操作</li>
<li>迁移管理方便</li>
</ul>
<h2>功能实现</h2>
<ul>
<li>✅ 文章管理（CRUD）</li>
<li>✅ 分类和标签</li>
<li>✅ 富文本编辑器</li>
<li>✅ 图片上传</li>
<li>✅ 评论系统</li>
<li>✅ 用户认证</li>
<li>✅ RSS 订阅</li>
<li>✅ Sitemap 生成</li>
</ul>
<h2>部署方案</h2>
<p>使用 Docker 容器化部署到 NAS，通过 Cloudflare Tunnel 暴露到公网。</p>
<h2>总结</h2>
<p>这个项目让我学到了很多，从前端到后端，从开发到部署，是一次完整的全栈实践。</p>`,
        published: true,
        publishedAt: new Date(Date.now() - 172800000),
        viewCount: 89,
        authorId: admin.id,
        categoryId: categories[2].id,
        tags: {
          create: [
            { tagId: tags[0].id },
            { tagId: tags[2].id },
            { tagId: tags[5].id },
          ],
        },
      },
    }),
  ]);
  console.log("✓ 文章创建成功:", posts.length, "篇");

  // 创建设置
  await Promise.all([
    prisma.setting.upsert({
      where: { key: "siteName" },
      update: { value: "VixenAhri Blog" },
      create: { key: "siteName", value: "VixenAhri Blog" },
    }),
    prisma.setting.upsert({
      where: { key: "siteDescription" },
      update: { value: "VixenAhri 的个人博客" },
      create: { key: "siteDescription", value: "VixenAhri 的个人博客" },
    }),
    prisma.setting.upsert({
      where: { key: "siteUrl" },
      update: { value: "https://blog.vixenahri.cn" },
      create: { key: "siteUrl", value: "https://blog.vixenahri.cn" },
    }),
    prisma.setting.upsert({
      where: { key: "siteAuthor" },
      update: { value: "VixenAhri" },
      create: { key: "siteAuthor", value: "VixenAhri" },
    }),
  ]);
  console.log("✓ 网站设置创建成功");

  console.log("\n✅ 数据初始化完成！");
  console.log("登录账号: Ahri");
  console.log("登录密码: Ahri");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
