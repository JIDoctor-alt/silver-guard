// ============================================================
// 乐龄守护 · 系统配置服务
// ============================================================
const pool = require('../db/mysql');

/**
 * 将数据库 snake_case 字段转换为 camelCase
 */
function toCamelCase(row) {
  if (!row) return null;
  return {
    id: row.id,
    configKey: row.config_key,
    configName: row.config_name,
    configType: row.config_type,
    category: row.category,
    configValue: row.config_value,
    description: row.description,
    isEditable: row.is_editable,
    sortOrder: row.sort_order,
  };
}

/**
 * 获取所有系统配置（可按分类过滤）
 * @param {string} [category] - 配置分类：LLM / PROMPT / SYSTEM
 */
async function getAllConfigs(category) {
  let sql = `SELECT id, config_key, config_name, config_type, category,
                    config_value, description, is_editable, sort_order
             FROM system_config
             WHERE deleted = 0`;
  const params = [];

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY sort_order ASC, id ASC`;

  const [rows] = await pool.query(sql, params);
  return rows.map(toCamelCase);
}

/**
 * 根据 config_key 获取单条配置
 * @param {string} key - 配置键
 */
async function getConfigByKey(key) {
  const [rows] = await pool.query(
    `SELECT id, config_key, config_name, config_type, category,
            config_value, description, is_editable, sort_order
     FROM system_config
     WHERE config_key = ? AND deleted = 0`,
    [key]
  );
  return toCamelCase(rows[0]);
}

/**
 * 更新配置值（仅允许更新 is_editable=1 的配置）
 * @param {string} key - 配置键
 * @param {string} value - 新的配置值
 */
async function updateConfig(key, value) {
  const [result] = await pool.query(
    `UPDATE system_config
     SET config_value = ?, gmt_modified = NOW()
     WHERE config_key = ? AND deleted = 0 AND is_editable = 1`,
    [value, key]
  );
  return result.affectedRows;
}

/**
 * 获取指定分类的配置键值对映射
 * @param {string} [category] - 配置分类：LLM / PROMPT / SYSTEM
 * @returns {object} { config_key: config_value, ... }
 */
async function getConfigMap(category) {
  let sql = `SELECT config_key, config_value
             FROM system_config
             WHERE deleted = 0`;
  const params = [];

  if (category) {
    sql += ` AND category = ?`;
    params.push(category);
  }

  sql += ` ORDER BY sort_order ASC, id ASC`;

  const [rows] = await pool.query(sql, params);

  const map = {};
  for (const row of rows) {
    map[row.config_key] = row.config_value;
  }
  return map;
}

module.exports = {
  getAllConfigs,
  getConfigByKey,
  updateConfig,
  getConfigMap,
};