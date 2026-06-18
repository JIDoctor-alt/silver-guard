// ============================================================
// 乐龄守护 · 后端配置
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
  JWT_SECRET: process.env.JWT_SECRET || 'leling-guardian-dev-secret-change-in-prod',
  JWT_EXPIRES_IN: '24h',

  // 时区
  TZ: process.env.TZ || 'Asia/Shanghai',

<<<<<<< HEAD
  // RAG / AI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || '',
  CHAT_MODEL: process.env.CHAT_MODEL || 'gpt-4o-mini',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
=======
  // LLM（大模型 API，OpenAI 兼容格式）
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_API_URL: process.env.LLM_API_URL || 'https://api.openai.com/v1',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',

  // LLM 作曲 · 系统提示词（可自定义，不配置则使用内置默认）
  LLM_COMPOSE_SYSTEM_PROMPT: process.env.LLM_COMPOSE_SYSTEM_PROMPT || '',
  LLM_COMPOSE_USER_PROMPT: process.env.LLM_COMPOSE_USER_PROMPT || '',

  // LLM 作词 · 系统提示词（可自定义，不配置则使用内置默认）
  LLM_LYRICS_SYSTEM_PROMPT: process.env.LLM_LYRICS_SYSTEM_PROMPT || '',
  LLM_LYRICS_USER_PROMPT: process.env.LLM_LYRICS_USER_PROMPT || '',

  // LLM 知识库问答 · 系统提示词（可自定义，不配置则使用内置默认）
  LLM_RAG_SYSTEM_PROMPT: process.env.LLM_RAG_SYSTEM_PROMPT || '',
  LLM_RAG_USER_PROMPT: process.env.LLM_RAG_USER_PROMPT || '',
  // 自定义知识库（JSON 数组字符串，不配置则使用内置默认）
  LLM_RAG_KNOWLEDGE: process.env.LLM_RAG_KNOWLEDGE || '',
>>>>>>> 8a79316 (feat: SSE/RAG/音乐智能体 + 提示词配置系统)
};

module.exports = config;
