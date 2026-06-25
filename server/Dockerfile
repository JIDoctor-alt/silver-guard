# =========================================================
# 乐龄守护 · Node.js 后端服务 Dockerfile
# 生产级：单阶段构建，Node 20 + 非 root 运行
# =========================================================
FROM node:20-alpine

WORKDIR /app

# 先复制依赖文件，安装后再复制源码（利用 Docker 缓存）
COPY server/package.json ./
RUN npm install --omit=dev --silent

COPY server/ ./

# 创建数据目录（持久化用户知识库）
RUN mkdir -p /app/data && chown -R node:node /app/data

EXPOSE 8080

# 使用内置的 node 用户（uid 1000），确保能写入挂载的 data 目录
USER node

CMD ["node", "src/server.js"]
