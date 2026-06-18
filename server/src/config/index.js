// ============================================================
// Silver Guard · 后端配置
// 所有环境变量统一在此导出
// ============================================================

const config = {
  // 服务端口
  PORT: Number(process.env.PORT || 8080),

  // MySQL
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
  MYSQL_USER: process.env.MYSQL_USER || 'silver_guard_app',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || 'app1234',
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'silver_guard',
  MYSQL_CONNECTION_LIMIT: 20,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'silver-guard-dev-secret-change-in-prod',
  JWT_EXPIRES_IN: '24h',

  // 时区
  TZ: process.env.TZ || 'Asia/Shanghai',
};

module.exports = config;
