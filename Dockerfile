# =========================================================
# Silver Guard · Dockerfile
# Java 21 + Spring Boot 3 单体应用
# 构建：docker build -t silver-guard:latest .
# 运行：docker run -d -p 8080:8080 --env-file .env silver-guard:latest
# =========================================================

# --- 多阶段构建：构建阶段 ---
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app

# 安装构建依赖（Alpine 轻量级）
RUN apk add --no-cache maven~=3.9

# 复制 POM（优先利用 Docker 缓存层）
COPY pom.xml .

# 下载依赖（单独写这一层，pom 变化时才重新下载）
RUN mvn dependency:go-offline \
        -B \
        --fail-never \
        -Dmaven.repo.local=/root/.m2/repository || true

# 复制源码
COPY src ./src

# 构建 JAR（跳过测试，CI 中已执行）
RUN mvn package \
        -DskipTests \
        -B \
        -Dmaven.repo.local=/root/.m2/repository \
        -Dmaven.javadoc.skip=true \
        -Dcheckstyle.skip=true \
        -Dspotless.check.skip=true \
        -Dspring.profiles.active=prod

# 提取胖 JAR
RUN mkdir -p /app/out && \
    cp target/silver-guard-*.jar /app/out/app.jar && \
    ls -lh /app/out/


# --- 多阶段构建：运行时阶段 ---
FROM eclipse-temurin:21-jre-alpine AS runtime

# 安全：非 root 运行
RUN addgroup -S silverguard && adduser -S silverguard -G silverguard

WORKDIR /app

# 安装时区数据（防止容器内时间不一致）
RUN apk add --no-cache tzdata~v2024a \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone

# 从构建阶段复制胖 JAR
COPY --from=builder /app/out/app.jar app.jar

# JVM 生产参数（参考，可根据容器内存调整）
ENV JAVA_OPTS="\
    -server \
    -Xms512m \
    -Xmx1024m \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+HeapDumpOnOutOfMemoryError \
    -XX:HeapDumpPath=/app/logs \
    -Djava.security.egd=file:/dev/./urandom \
    -Dspring.profiles.active=prod \
    "

# 日志目录
RUN mkdir -p /app/logs && chown -R silverguard:silverguard /app

USER silverguard

EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# 启动命令
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
