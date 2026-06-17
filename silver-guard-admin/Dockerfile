# =========================================================
# Silver Guard · Admin 前端 Dockerfile
# React 19 + Vite + Ant Design 5
# 多阶段构建：构建阶段 → Nginx 运行阶段
# 构建：docker build -t silver-guard-admin:latest -f silver-guard-admin/Dockerfile .
# =========================================================

# --- Stage 1: 构建阶段 ---
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 并安装依赖（优先利用缓存）
COPY silver-guard-admin/package.json ./
COPY silver-guard-admin/package-lock.json* ./
RUN npm ci --silent || npm install --silent

# 复制源码
COPY silver-guard-admin/ ./

# 构建（生产环境）
ENV NODE_ENV=production
RUN npm run build

# 查看构建产物（便于调试）
RUN ls -lh dist/

# --- Stage 2: 运行阶段（Nginx 提供静态文件 + API 代理）---
FROM nginx:alpine AS runtime

# 设置时区
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 复制 Nginx 配置（前端 + /api 代理到后端）
COPY silver-guard-admin/nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制静态文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 健康检查：访问首页
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
