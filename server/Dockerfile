# =========================================================
# Silver Guard · Node.js 后端服务 Dockerfile
# 生产级：单阶段构建，Node 20 + 非 root 运行
# =========================================================
FROM node:20-alpine

WORKDIR /app

# 先复制依赖文件，安装后再复制源码（利用 Docker 缓存）
COPY server/package.json ./
RUN npm install --omit=dev --silent

COPY server/ ./

# 非 root 用户运行（安全最佳实践）
RUN addgroup -S silver && adduser -S silver -G silver
USER silver

EXPOSE 8080

CMD ["node", "src/server.js"]
