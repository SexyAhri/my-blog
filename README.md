# VixenAhri Blog

一个基于 Next.js 16 的现代化个人博客系统。

**在线预览**: [blog.vixenahri.cn](https://blog.vixenahri.cn)

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **UI**: Ant Design 5
- **数据库**: PostgreSQL + Prisma
- **认证**: NextAuth.js
- **编辑器**: TipTap
- **代码高亮**: Prism.js
- **邮件**: Resend
- **部署**: Docker + Watchtower

## 功能特性

### 博客前台

- 文章列表、详情、目录导航
- 阅读时间估算
- 代码语法高亮
- 图片懒加载 + 点击放大
- 文章点赞
- 文章分享（Twitter、微博、微信、复制链接）
- 返回顶部按钮
- 分类、标签、归档
- 文章系列/专栏
- 全文搜索
- 评论系统（支持审核、回复通知）
- RSS 订阅 & Sitemap
- Google Analytics 统计
- SEO 优化（JSON-LD 结构化数据、Open Graph、Twitter Cards）
- 隐私政策页面
- 响应式设计

### 后台管理

- 仪表盘数据统计
- 文章管理（富文本编辑器、Markdown 快捷键）
- 定时发布
- 草稿预览
- 批量操作（发布、删除）
- 分类 / 标签 / 系列管理
- 媒体库（图片上传）
- 评论管理
- 访问统计
- 网站设置（SEO、社交媒体、显示选项）
- 个人信息（头像、密码修改）
- 系统日志
- 深色 / 浅色主题

## 快速开始

### 环境要求

- Node.js 20+
- PostgreSQL 14+

### 本地开发

```bash
# 克隆项目
git clone https://github.com/SexyAhri/my-blog.git
cd my-blog

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库连接等配置

# 初始化数据库
npx prisma db push
npx prisma db seed

# 启动开发服务器
npm run dev
```

访问 http://localhost:5177

### 环境变量

```env
DATABASE_URL="postgresql://user:password@host:5432/myblog"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:5177"

# 管理员账号（Seed 脚本使用）
ADMIN_EMAIL="admin@example.com"
ADMIN_NAME="Admin"
ADMIN_PASSWORD="your-password"

# 邮件通知（可选）
RESEND_API_KEY="re_xxxxxxxxxxxx"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"

# 定时发布（可选）
CRON_SECRET="your-cron-secret"
```

## Docker 部署

### 使用 Docker Compose

```yaml
version: "3.8"
services:
  blog:
    image: ahridocker/my-blog:latest
    container_name: vixenahri-blog
    restart: unless-stopped
    ports:
      - "5177:5177"
    environment:
      - DATABASE_URL=postgresql://user:pass@host:5432/myblog
      - NEXTAUTH_SECRET=your-secret
      - NEXTAUTH_URL=https://your-domain.com
      - RESEND_API_KEY=re_xxxxxxxxxxxx
      - NEXT_PUBLIC_SITE_URL=https://your-domain.com
    volumes:
      - ./uploads:/app/public/uploads

  watchtower:
    image: containrrr/watchtower:latest
    container_name: watchtower
    restart: unless-stopped
    environment:
      - DOCKER_API_VERSION=1.44
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup vixenahri-blog
```

```bash
docker compose up -d
```

### 初始化数据库

```bash
docker exec -it vixenahri-blog npx prisma db push
docker exec -it vixenahri-blog npx prisma db seed
```

## 项目结构

```
my-blog/
├── app/
│   ├── (blog)/          # 前台页面
│   ├── admin/           # 后台管理
│   ├── api/             # API 路由
│   ├── feed.xml/        # RSS
│   └── sitemap.ts       # Sitemap
├── components/
│   ├── admin/           # 后台组件
│   ├── blog/            # 前台组件
│   └── common/          # 通用组件
├── lib/                 # 工具库
├── prisma/              # 数据库
└── public/uploads/      # 上传文件
```

## 开发命令

```bash
npm run dev       # 开发模式
npm run build     # 构建
npm start         # 生产模式
npm run lint      # 代码检查
```

## License

MIT
