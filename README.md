# VixenAhri Blog

A personal blog and admin workspace built with Next.js 16, Prisma, PostgreSQL, and Ant Design.

Live site: [https://blog.vixenahri.cn](https://blog.vixenahri.cn)

## Overview

This project ships with:

- A public blog with posts, categories, tags, series pages, search, RSS, sitemap, comments, and SEO metadata
- An admin dashboard for writing posts, managing media, moderating comments, and updating site settings
- A server-side admin access gate that can require a secret entry URL before the normal admin login page
- Scheduled publishing support protected by a bearer token
- Media usage auditing to detect missing files, orphaned uploads, and broken references
- An SSR-first public data layer for sidebar, footer, analytics, and initial comment data

## Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Ant Design 6
- PostgreSQL
- Prisma
- NextAuth credentials authentication
- TipTap editor
- Resend for comment notification emails
- Docker Compose for deployment

## Key Features

### Public blog

- Post listing, post detail, categories, tags, archives, and series pages
- Search endpoint and dedicated search page
- Rich post content rendering with table of contents and reading time
- Comments with moderation and reply notification support
- RSS feed and sitemap generation
- Open Graph, Twitter card, and structured metadata support
- Profile card settings, social links, privacy page, and footer settings
- Server-rendered sidebar, footer, analytics config, category nav, and initial comment payloads

### Admin dashboard

- Post editor with draft, publish, schedule, taxonomy, and cover image support
- Category, tag, and series management
- Series cover image support in both admin and public views
- Media library with upload, usage analysis, orphan detection, and safe delete rules
- Settings, profile, password change, and analytics configuration
- Stats and log views

### Security and validation

- Admin middleware gate using `ADMIN_ACCESS_KEY`
- Server-side validation for post, settings, profile, series, and media mutations
- Matching client-side form validation for the main admin forms
- Protected cron endpoint using `Authorization: Bearer <CRON_SECRET>`

## Additional Docs

- [Maintenance Notes](docs/maintenance.md)

## Getting Started

### Requirements

- Node.js 20+
- PostgreSQL 14+

### Local development

```bash
git clone https://github.com/SexyAhri/my-blog.git
cd my-blog
npm install
Copy-Item .env.example .env
```

Update `.env`, then run:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

The app runs on `http://localhost:5177`.

## Environment Variables

### Required for local development

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | Base URL for auth callbacks, usually `http://localhost:5177` locally |
| `NEXTAUTH_SECRET` | Random secret for NextAuth |
| `ADMIN_EMAIL` | Seed admin email |
| `ADMIN_NAME` | Seed admin display name |
| `ADMIN_PASSWORD` | Seed admin password |

### Optional but recommended

| Variable | Description |
| --- | --- |
| `ADMIN_ACCESS_KEY` | Extra server-only gate for `/admin`; visit `/admin/login/<key>` once to set the cookie |
| `RESEND_API_KEY` | Enables comment notification emails |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used in emails and absolute links |
| `CRON_SECRET` | Secures `/api/cron/publish` |
| `ANALYTICS_TIME_ZONE` | Time zone used by the admin stats queries; defaults to `Asia/Shanghai` |

## Database Workflow

Prisma migrations are now the source of truth for schema changes.

- Use `npm run prisma:migrate` during local development
- Use `npm run prisma:migrate:deploy` in production, CI, and containers
- Use `npm run prisma:bootstrap` only when you need a safe first-admin bootstrap outside Docker
- Use `npm run prisma:seed` only for disposable local/demo databases
- Keep new schema changes in `prisma/migrations/*` instead of adding new one-off SQL files

The search optimization migration enables PostgreSQL `pg_trgm` and creates trigram indexes for published post search. If your database role cannot create extensions, install `pg_trgm` before running deploy migrations.

## Admin Access Flow

If `ADMIN_ACCESS_KEY` is set:

1. Visit `/admin/login/<your-key>`
2. Middleware stores a secure admin gate cookie
3. You are redirected to `/admin/login`
4. Sign in with the seeded or existing admin account

If `ADMIN_ACCESS_KEY` is empty, the extra gate is disabled and `/admin/login` stays directly accessible.

## Media Library Audit

The admin media page includes storage and usage auditing:

- Detects where each upload is used
- Flags tracked media that are missing from storage
- Finds orphaned files that exist on disk but are not tracked
- Finds broken references that point to uploads that no longer exist
- Prevents deletion of files that are still referenced

## Scheduler

Scheduled posts are published through:

```text
GET /api/cron/publish
Authorization: Bearer <CRON_SECRET>
```

If `CRON_SECRET` is not configured, the endpoint returns `503`.

## Useful Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:bootstrap
npm run prisma:studio
npm run db:push
npm run db:seed
```

`npm run db:push` is still available for disposable local experiments, but it should not replace the migration workflow for shared environments.
`npm run db:seed` resets the database and loads demo data, so do not run it against a live environment.

## Docker Deployment

Use `.env.local.example` as a deployment template, then start the stack with:

```bash
docker compose up -d
```

Optional Cloudflare tunnel:

```bash
docker compose --profile cloudflare up -d
```

Deploy flow:

```bash
git push origin master
```

Then GitHub Actions builds and pushes the Docker image, Watchtower pulls the new image on the server, and the container startup sequence automatically:

- runs `prisma migrate deploy`
- retries migrations until the database is reachable
- creates the first admin user and default site settings when the database is empty
- starts the app only after the bootstrap steps succeed

The startup bootstrap is safe for live environments. It does not reset data and only initializes the admin/settings on an empty database.

Do not run `npm run db:seed` in production unless you intentionally want to wipe the database and load demo content.

## Notes

- `npm run lint` and `npm run build` currently pass.
- The build may still show `baseline-browser-mapping` age warnings even with the latest published package. That warning is upstream data freshness, not a local pin mismatch.

## License

MIT
