-- =========================================================
-- Silver Guard · 系统配置模块
-- 数据库迁移脚本 v6.0
-- 新增：系统配置表（大模型配置 / 提示词配置）
-- =========================================================

SET NAMES utf8mb4;

USE silver_guard;

-- =========================================================
-- 27 系统配置表（SystemConfig）
-- 存储大模型配置和各类提示词配置
-- 支持多个 LLM 配置的分类存储
-- =========================================================
CREATE TABLE IF NOT EXISTS system_config (
    id              BIGINT UNSIGNED  NOT NULL  AUTO_INCREMENT  COMMENT '配置ID',
    config_key       VARCHAR(128)     NOT NULL                     COMMENT '配置键（唯一）',
    config_name      VARCHAR(128)     NOT NULL                     COMMENT '配置名称',
    config_type      VARCHAR(32)      NOT NULL  DEFAULT 'TEXT'     COMMENT '配置类型：TEXT / JSON / URL',
    category        VARCHAR(32)      NOT NULL  DEFAULT 'LLM'       COMMENT '分类：LLM / PROMPT / SYSTEM',
    config_value     TEXT             NOT NULL                     COMMENT '配置值',
    description     VARCHAR(500)     DEFAULT NULL                 COMMENT '描述说明',
    is_editable      TINYINT         NOT NULL  DEFAULT 1          COMMENT '是否可编辑：0-不可编辑（系统内置）1-可编辑',
    sort_order       INT              NOT NULL  DEFAULT 0          COMMENT '排序',
    gmt_create      DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3)  COMMENT '创建时间',
    gmt_modified    DATETIME(3)     NOT NULL  DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)  COMMENT '更新时间',
    deleted         TINYINT         NOT NULL  DEFAULT 0           COMMENT '软删除标记',
    PRIMARY KEY (id),
    UNIQUE KEY uk_config_key (config_key),
    KEY idx_category (category)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8mb4  COLLATE=utf8mb4_unicode_ci  COMMENT='系统配置表';

-- =========================================================
-- 初始化种子数据：大模型基础配置
-- =========================================================
INSERT INTO system_config (config_key, config_name, config_type, category, config_value, description, is_editable, sort_order) VALUES
('LLM_API_KEY', '大模型 API Key', 'TEXT', 'LLM', '', 'OpenAI 兼容接口的 API Key，用于调用通义千问/DeepSeek/智谱', 1, 1),
('LLM_API_URL', '大模型 API 地址', 'URL', 'LLM', 'https://api.deepseek.com', 'DeepSeek API 地址（OpenAI 兼容格式），文档见 https://api-docs.deepseek.com/zh-cn/', 1, 2),
('LLM_MODEL', '大模型名称', 'TEXT', 'LLM', 'deepseek-v4-pro', '模型名称：deepseek-v4-pro（旗舰）/ deepseek-v4-flash（快速）', 1, 3);

-- =========================================================
-- 初始化种子数据：AI 作曲提示词配置
-- =========================================================
INSERT INTO system_config (config_key, config_name, config_type, category, config_value, description, is_editable, sort_order) VALUES
('LLM_COMPOSE_SYSTEM_PROMPT', 'AI 作曲 - 系统提示词', 'TEXT', 'PROMPT', '你是一位资深的国风音乐作曲家，精通中国传统音乐理论、五声音阶、民族调式和配器技法。请根据用户要求创作一首适合广场舞的国风音乐，输出完整的旋律创作方案。要求：
1. 符合五声音阶和中国民族调式
2. 节奏适合广场舞，通常为中速
3. 给出旋律动机、和声进行、配器建议
4. 使用清晰的结构输出，便于理解', '系统提示词，给 LLM 的前置指令', 1, 10),
('LLM_COMPOSE_USER_PROMPT', 'AI 作曲 - 用户模板', 'TEXT', 'PROMPT', '请创作一首{{style}}广场舞音乐，节奏{{tempo}}，使用{{scale}}音阶，主乐器为{{instrument}}。', '用户提示词模板，{{placeholder}}会被替换', 1, 11);

-- =========================================================
-- 初始化种子数据：AI 作词提示词配置
-- =========================================================
INSERT INTO system_config (config_key, config_name, config_type, category, config_value, description, is_editable, sort_order) VALUES
('LLM_LYRICS_SYSTEM_PROMPT', 'AI 作词 - 系统提示词', 'TEXT', 'PROMPT', '你是一位资深的国风填词人，精通中国古典诗词格律、押韵技巧和意境营造。请根据用户要求创作一首适合广场舞或国风歌曲的歌词，要求：
1. 意境优美，符合国风审美
2. 押韵自然，朗朗上口，适合演唱
3. 结构清晰，分节明确
4. 语言简洁，易于传唱', '系统提示词，给 LLM 的前置指令', 1, 20),
('LLM_LYRICS_USER_PROMPT', 'AI 作词 - 用户模板', 'TEXT', 'PROMPT', '主题：{{theme}}\n风格：{{style}}\n要求字数：{{count}} 字左右\n押韵：{{rhyme}}\n请创作一首完整的歌词。', '用户提示词模板，{{placeholder}}会被替换', 1, 21);

-- =========================================================
-- 初始化种子数据：RAG 问答提示词配置
-- =========================================================
INSERT INTO system_config (config_key, config_name, config_type, category, config_value, description, is_editable, sort_order) VALUES
('LLM_RAG_SYSTEM_PROMPT', 'RAG 问答 - 系统提示词', 'TEXT', 'PROMPT', '你是乐龄守护智慧养老平台的 AI 助手，请根据知识库中的信息回答用户关于养老、健康、生活的问题。要求：
1. 语言通俗易懂，适合老年人阅读
2. 只使用知识库中的信息，如果不知道请直说，不要编造
3. 回答要简洁明了，重点突出，不要太冗长
4. 如果涉及健康建议，提醒用户必要时请咨询专业医生', '系统提示词，给 LLM 的前置指令', 1, 30),
('LLM_RAG_USER_PROMPT', 'RAG 问答 - 用户模板', 'TEXT', 'PROMPT', '参考知识：
{{context}}

用户问题：{{question}}

请根据参考知识回答用户问题。', '用户提示词模板，{{placeholder}}会被替换', 1, 31);

-- =========================================================
-- 迁移完成
-- =========================================================