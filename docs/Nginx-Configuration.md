# Silver Guard · Nginx 配置

> 用途：统一入口（API + 管理后台 + 静态资源），处理 CORS、HTTPS、限流、缓存
> 容器化部署：通过 `docker-compose.yml` 挂载配置
> 非容器化部署：配置位于 `/etc/nginx/nginx.conf`

---

## 目录结构

```
/workspace/nginx/
├── nginx.conf              # 主配置（全局配置）
├── conf.d/
│   ├── silver-guard.conf    # Silver Guard 主站点（API + 后台）
│   └── family-miniapp.conf  # 家属小程序独立域名（可选）
├── ssl/                     # SSL 证书目录
│   ├── fullchain.pem
│   └── privkey.pem
└── logs/                    # 日志目录（Nginx 挂载）
    ├── access.log
    └── error.log
```

---

# ① nginx.conf（主配置）

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    # 单个 worker 允许最大连接数
    worker_connections 4096;
    # 复用已连接的 socket
    multi_accept on;
    # 使用高效的事件模型（Linux）
    use epoll;
}

http {
    # 基本配置
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # 字符编码（全局 UTF-8）
    charset utf-8;

    # ==================== 日志格式 ====================
    # 标准访问日志（JSON 格式，便于 ELK 分析）
    log_format main_json escape=json
        '{'
          '"timestamp":"$time_iso8601",'
          '"remote_addr":"$remote_addr",'
          '"remote_user":"$remote_user",'
          '"request_method":"$request_method",'
          '"request_uri":"$request_uri",'
          '"server_protocol":"$server_protocol",'
          '"status":$status,'
          '"body_bytes_sent":$body_bytes_sent,'
          '"http_referer":"$http_referer",'
          '"http_user_agent":"$http_user_agent",'
          '"http_x_forwarded_for":"$http_x_forwarded_for",'
          '"request_time":$request_time,'
          '"upstream_response_time":"$upstream_response_time",'
          '"upstream_status":"$upstream_status"'
        '}';

    access_log /var/log/nginx/access.log main_json;

    # ==================== 性能优化 ====================
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # 超时时间（单位：秒）
    client_header_timeout 30s;
    client_body_timeout   30s;
    send_timeout           30s;
    keepalive_timeout     30s;

    # ==================== 压缩配置 ====================
    gzip on;
    gzip_vary on;
    gzip_comp_level 5;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        application/xml
        application/xml+rss
        image/svg+xml
        font/ttf
        font/otf;

    # 长连接（与后端保持 keepalive，减少握手）
    keepalive_requests 100;
    keepalive_disable none;

    # ==================== 安全头 ====================
    # 通用安全响应头（所有 server 继承）
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # ==================== 文件上传限制 ====================
    # 单次上传最大 10MB（老人照片/巡检拍照）
    client_max_body_size 10M;
    client_body_buffer_size 128k;

    # ==================== 限流配置（基于 IP）====================
    # API 限流：100 请求/秒（burst 允许瞬时 200，延迟处理）
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;

    # 登录限流：5 请求/分钟（防止暴力破解）
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # 连接数限制：每个 IP 最多 10 个并发连接
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # ==================== 包含子配置 ====================
    include /etc/nginx/conf.d/*.conf;
}
```

---

# ② conf.d/silver-guard.conf（主站点）

```nginx
# ============================================
# Silver Guard 主站点（含 API + 管理后台）
# 生产环境请启用 HTTPS
# ============================================

# -------- HTTP → HTTPS 强制跳转 --------
server {
    listen 80;
    listen [::]:80;
    server_name api.silver-guard.cn admin.silver-guard.cn;

    # 强制 HTTPS（HSTS）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    return 301 https://$host$request_uri;
}

# ============================================
# ① HTTPS: 管理后台（admin.silver-guard.cn）
# ============================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.silver-guard.cn;

    # -------- SSL 配置 --------
    ssl_certificate      /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key  /etc/nginx/ssl/privkey.pem;
    ssl_protocols        TLSv1.2 TLSv1.3;
    ssl_ciphers          ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers on;
    ssl_session_cache    shared:SSL:10m;
    ssl_session_timeout  10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # -------- 文档根目录：Vue3 构建产物 --------
    root /usr/share/nginx/html/admin;
    index index.html;

    # ============================================
    # CORS 配置（管理后台 API 跨域白名单）
    # ============================================
    # 允许的 Origin（管理后台域名 + 本地开发端口）
    set $cors_origin "";
    if ($http_origin ~* "^https?://(admin\.silver-guard\.cn|localhost:5173|127\.0\.0\.1:5173)$") {
        set $cors_origin $http_origin;
    }

    # 预检请求（OPTIONS）直接返回 204
    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin $cors_origin;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Auth-Token, X-Trace-Id";
        add_header Access-Control-Allow-Credentials "true";
        add_header Access-Control-Max-Age "86400";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        return 204;
    }

    # 正常请求添加 CORS 头
    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Auth-Token, X-Trace-Id" always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Expose-Headers "X-Trace-Id" always;

    # ============================================
    # 连接限制（防止 DoS）
    # ============================================
    limit_conn conn_limit 10;

    # ============================================
    # 静态资源（Vue3 前端）
    # ============================================
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 前端资源缓存（JS/CSS/图片/字体，带 hash 文件名可长期缓存）
    location ~* \.(?:js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # HTML 不缓存（保证版本更新）
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # ============================================
    # 管理后台 API 路由（反向代理到 Spring Boot）
    # ============================================
    location /api/v1/admin/ {
        # 限速：100 请求/秒
        limit_req zone=api_limit burst=200 nodelay;

        # 真实 IP 透传
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Trace-Id $request_id;

        # 超时配置
        proxy_connect_timeout 10s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;

        # 长连接
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;

        # 代理到后端服务
        proxy_pass http://127.0.0.1:8080;
    }

    # ============================================
    # Actuator 监控（限内网或特定 IP 访问）
    # ============================================
    location /actuator/ {
        allow 127.0.0.1;
        allow 10.0.0.0/8;       # 内网
        allow 172.16.0.0/12;    # Docker 网络
        allow 192.168.0.0/16;   # 内网
        deny all;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_pass http://127.0.0.1:8080;
    }

    # ============================================
    # 登录接口独立限流（防止暴力破解）
    # ============================================
    location = /api/v1/auth/login {
        limit_req zone=login_limit burst=3 nodelay;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Trace-Id $request_id;
        proxy_pass http://127.0.0.1:8080;
    }

    # 上传文件大小限制（本 location 继承全局 10M）
    location /api/v1/elders/photo {
        client_max_body_size 5M;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Trace-Id $request_id;
        proxy_pass http://127.0.0.1:8080;
    }
}

# ============================================
# ② HTTPS: API 网关（网格员 App + 家属小程序）
# ============================================
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.silver-guard.cn;

    # -------- SSL 配置 --------
    ssl_certificate      /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key  /etc/nginx/ssl/privkey.pem;
    ssl_protocols        TLSv1.2 TLSv1.3;
    ssl_ciphers          ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers on;
    ssl_session_cache    shared:SSL:10m;
    ssl_session_timeout  10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ============================================
    # CORS 配置（App 和小程序）
    # ============================================
    # 允许的 Origin（小程序 App 来源较多样，按需开放）
    # 注意：微信小程序有独立的域名白名单机制，不依赖浏览器 CORS
    set $cors_origin "";
    if ($http_origin ~* "^https?://([a-z0-9-]+\.)?silver-guard\.cn$") {
        set $cors_origin $http_origin;
    }

    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin $cors_origin;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Auth-Token, X-Trace-Id, X-Device-Id";
        add_header Access-Control-Allow-Credentials "true";
        add_header Access-Control-Max-Age "86400";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        return 204;
    }

    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, PATCH, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With, X-Auth-Token, X-Trace-Id, X-Device-Id" always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Expose-Headers "X-Trace-Id" always;

    # ============================================
    # 设备数据上报入口（MQTT 网关 HTTP 转发）
    # ============================================
    location /api/v1/devices/report {
        # 设备上报是高频请求，较宽松的限流
        limit_req zone=api_limit burst=500 nodelay;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Trace-Id $request_id;

        # 设备上报容忍较长超时（边缘网络不稳）
        proxy_connect_timeout 15s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;

        proxy_pass http://127.0.0.1:8080;
    }

    # ============================================
    # 通用 API（App / 小程序 / 第三方）
    # ============================================
    location /api/v1/ {
        limit_req zone=api_limit burst=200 nodelay;
        limit_conn conn_limit 10;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Trace-Id $request_id;

        proxy_connect_timeout 10s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;

        proxy_http_version 1.1;
        proxy_set_header Connection "";

        proxy_pass http://127.0.0.1:8080;
    }

    # ============================================
    # 健康检查接口（对外开放，供负载均衡探测）
    # ============================================
    location = /health {
        proxy_pass http://127.0.0.1:8080/actuator/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # ============================================
    # 拒绝不安全的方法 / 路径扫描
    # ============================================
    location ~* \.(?:bak|sql|log|conf|ini|env|git|svn)$ {
        deny all;
        access_log off;
        log_not_found off;
    }

    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    location = /robots.txt {
        return 200 "User-agent: *\nDisallow: /api/\nAllow: /$\n";
        add_header Content-Type text/plain;
        access_log off;
    }
}
```

---

# ③ conf.d/family-miniapp.conf（家属小程序独立域名可选）

```nginx
# ============================================
# 家属端小程序（独立域名 family.silver-guard.cn）
# 微信小程序域名必须在微信公众平台白名单中
# ============================================

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name family.silver-guard.cn;

    # -------- SSL 配置 --------
    ssl_certificate      /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key  /etc/nginx/ssl/privkey.pem;
    ssl_protocols        TLSv1.2 TLSv1.3;
    ssl_ciphers          ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers on;
    ssl_session_cache    shared:SSL_FAMILY:5m;
    ssl_session_timeout  10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # -------- 微信小程序接口请求 --------
    # 小程序不跨域，但 Nginx 仍需作为 API 网关统一管理
    location /api/v1/family/ {
        limit_req zone=api_limit burst=100 nodelay;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Trace-Id $request_id;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 10s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;

        proxy_pass http://127.0.0.1:8080;
    }

    # 健康检查
    location = /health {
        proxy_pass http://127.0.0.1:8080/actuator/health;
        access_log off;
    }
}
```

---

# ④ docker-compose.yml 挂载说明

> 如使用 Docker Compose 部署，`docker-compose.yml` 中 Nginx 服务应挂载上述配置

```yaml
nginx:
    image: nginx:alpine
    container_name: silver-guard-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html/admin:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - silver-guard-net
```

---

# ⑤ Nginx 配置自检命令

```bash
# 配置语法检查（必须执行！）
nginx -t
nginx -T   # 打印完整配置（含 include），便于排查

# 热重载（不中断服务）
nginx -s reload

# 重新打开日志文件（日志切割后使用）
nginx -s reopen

# 查看连接状态
netstat -an | grep :80 | wc -l
ss -s | grep -i tcp

# 查看错误日志（实时）
tail -f /var/log/nginx/error.log

# 查看访问日志（按状态码统计）
grep -oE '"status":[0-9]+' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head

# 查看前 10 个请求最多的 IP
grep -oE '"remote_addr":"[0-9.]+' /var/log/nginx/access.log | sort | uniq -c | sort -rn | head -10
```

---

# ⑥ 安全加固建议

| # | 项目 | 操作 | 说明 |
| --- | --- | --- | --- |
| 1 | **证书自动续期** | 使用 Certbot 自动续期 Let's Encrypt 证书 | 避免证书过期导致全站不可用 |
| 2 | **WAF（可选）** | 接入云厂商 WAF（阿里云盾 / 腾讯云 WAF） | 拦截常见 Web 攻击 |
| 3 | **DDoS 防护** | 启用云厂商 DDoS 高防 | 夜间预警时段关键 |
| 4 | **IP 白名单（内部接口）** | `/actuator/*` 仅允许内网访问 | 防止敏感指标泄露 |
| 5 | **日志收集** | Nginx 日志 → ELK / 日志服务 | 便于审计与问题排查 |
| 6 | **定期安全扫描** | NAXSI / ModSecurity / OWASP ZAP | 月度扫描 |
| 7 | **限流参数** | `limit_req`/`limit_conn` 参数根据实际业务调整 | 避免误杀正常流量 |

---

**— Nginx 配置文件结束 —**
