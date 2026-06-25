// ============================================================
// 乐龄守护 · 后端配置
// 所有环境变量统一在此导出
// 支持从数据库 system_config 表动态加载配置
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
  JWT_SECRET: process.env.JWT_SECRET || 'leling-guardian-dev-secret-change-in-prod',
  JWT_EXPIRES_IN: '24h',

  // 时区
  TZ: process.env.TZ || 'Asia/Shanghai',

  // LLM（大模型 API，OpenAI 兼容格式）
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_API_URL: process.env.LLM_API_URL || 'https://api.deepseek.com',
  LLM_MODEL: process.env.LLM_MODEL || 'deepseek-v4-pro',

  // LLM 作曲 · 系统提示词（可自定义）
  LLM_COMPOSE_SYSTEM_PROMPT: process.env.LLM_COMPOSE_SYSTEM_PROMPT || '',
  LLM_COMPOSE_USER_PROMPT: process.env.LLM_COMPOSE_USER_PROMPT || '',

  // LLM 作词 · 系统提示词（可自定义）
  LLM_LYRICS_SYSTEM_PROMPT: process.env.LLM_LYRICS_SYSTEM_PROMPT || '',
  LLM_LYRICS_USER_PROMPT: process.env.LLM_LYRICS_USER_PROMPT || '',

  // LLM 知识库问答 · 系统提示词（可自定义）
  LLM_RAG_SYSTEM_PROMPT: process.env.LLM_RAG_SYSTEM_PROMPT || '',
  LLM_RAG_USER_PROMPT: process.env.LLM_RAG_USER_PROMPT || '',
  // 自定义知识库（JSON 数组字符串）
  LLM_RAG_KNOWLEDGE: process.env.LLM_RAG_KNOWLEDGE || '',

  // 高德地图 API
  AMAP_API_KEY: process.env.AMAP_API_KEY || '',
  AMAP_SECURITY_KEY: process.env.AMAP_SECURITY_KEY || '',

  // ==================== 从数据库加载配置 ====================
  // 在 DB 连接就绪后调用，从 system_config 表覆盖 LLM 和高德配置
  // 数据库配置优先级高于环境变量
  _dbLoaded: false,

  async loadFromDb() {
    if (this._dbLoaded) return;
    try {
      const pool = require('../db/mysql');
      const [rows] = await pool.query(
        'SELECT config_key, config_value FROM system_config WHERE deleted = 0 AND is_editable = 1'
      );
      const dbConfig = {};
      for (const row of rows) {
        dbConfig[row.config_key] = row.config_value;
      }

      // 覆盖 LLM 配置（数据库有值则使用，否则保留环境变量）
      if (dbConfig.LLM_API_KEY) this.LLM_API_KEY = dbConfig.LLM_API_KEY;
      if (dbConfig.LLM_API_URL) this.LLM_API_URL = dbConfig.LLM_API_URL;
      if (dbConfig.LLM_MODEL) this.LLM_MODEL = dbConfig.LLM_MODEL;

      if (dbConfig.LLM_COMPOSE_SYSTEM_PROMPT) this.LLM_COMPOSE_SYSTEM_PROMPT = dbConfig.LLM_COMPOSE_SYSTEM_PROMPT;
      if (dbConfig.LLM_COMPOSE_USER_PROMPT) this.LLM_COMPOSE_USER_PROMPT = dbConfig.LLM_COMPOSE_USER_PROMPT;

      if (dbConfig.LLM_LYRICS_SYSTEM_PROMPT) this.LLM_LYRICS_SYSTEM_PROMPT = dbConfig.LLM_LYRICS_SYSTEM_PROMPT;
      if (dbConfig.LLM_LYRICS_USER_PROMPT) this.LLM_LYRICS_USER_PROMPT = dbConfig.LLM_LYRICS_USER_PROMPT;

      if (dbConfig.LLM_RAG_SYSTEM_PROMPT) this.LLM_RAG_SYSTEM_PROMPT = dbConfig.LLM_RAG_SYSTEM_PROMPT;
      if (dbConfig.LLM_RAG_USER_PROMPT) this.LLM_RAG_USER_PROMPT = dbConfig.LLM_RAG_USER_PROMPT;

      if (dbConfig.AMAP_API_KEY) this.AMAP_API_KEY = dbConfig.AMAP_API_KEY;
      if (dbConfig.AMAP_SECURITY_KEY) this.AMAP_SECURITY_KEY = dbConfig.AMAP_SECURITY_KEY;

      this._dbLoaded = true;
      console.log('[config] 已从数据库加载系统配置');
    } catch (err) {
      console.warn('[config] 加载数据库配置失败，使用环境变量默认值:', err.message);
    }
  },

  // 重新加载配置（配置更新后调用）
  async reloadFromDb() {
    this._dbLoaded = false;
    await this.loadFromDb();
  },
};

module.exports = config;
