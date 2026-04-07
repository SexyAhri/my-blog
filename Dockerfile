# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 OpenSSL（Prisma 需要）
RUN apk add --no-cache openssl

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5177
ENV RUN_DB_MIGRATIONS=true
ENV BOOTSTRAP_ADMIN_ON_EMPTY_DB=true

# 安装 OpenSSL
RUN apk add --no-cache openssl

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY scripts/bootstrap-admin.mjs ./scripts/bootstrap-admin.mjs
COPY scripts/docker-entrypoint.sh ./scripts/docker-entrypoint.sh

# 创建上传目录
RUN mkdir -p public/uploads \
  && chmod +x ./scripts/docker-entrypoint.sh \
  && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 5177

ENTRYPOINT ["./scripts/docker-entrypoint.sh"]
CMD ["node", "server.js"]
