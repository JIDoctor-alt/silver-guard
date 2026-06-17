# =========================================================
# Silver Guard · Mock API（Node.js + Express）
# 连接 MySQL + Redis，模拟后端 REST API
# 构建：docker build -t silver-guard-mock-api:latest -f mock-api/Dockerfile .
# =========================================================

FROM node:20-alpine

# 设置时区
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

WORKDIR /app

# 复制 package 并安装依赖
COPY mock-api/package.json ./
COPY mock-api/package-lock.json* ./
RUN npm ci --omit=dev --silent || npm install --omit=dev --silent

# 复制源码
COPY mock-api/ ./

# 健康检查
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

# 非 root 运行（Node 官方镜像自带 node 用户）
USER node

CMD ["node", "server.js"]
