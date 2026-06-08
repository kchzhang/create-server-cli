# ===== Build Stage =====
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ===== Runtime Stage =====
FROM node:22-alpine AS runtime

# 时区
ENV TZ=Asia/Shanghai
RUN apk add --no-cache tzdata && \
    ln -sf /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo "${TZ}" > /etc/timezone

# 非 root 用户
RUN addgroup -S nitro && adduser -S nitro -G nitro

WORKDIR /app

# Nitro trace 已将所有运行时依赖打入 .output，无需 npm install
COPY --from=builder /app/.output .output
COPY --from=builder /app/logs logs

RUN chown -R nitro:nitro /app

USER nitro

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", ".output/server/index.mjs"]
