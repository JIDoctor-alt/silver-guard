// ============================================================
// 乐龄守护 · 统一响应格式
// ============================================================
const dayjs = require('dayjs');

/**
 * 统一成功响应
 */
function ok(res, data, message = 'success') {
  res.json({
    code: 200,
    message,
    data,
    timestamp: dayjs().valueOf(),
  });
}

/**
 * 统一错误响应
 */
function fail(res, statusCode, message, data = null) {
  res.status(statusCode).json({
    code: statusCode,
    message,
    data,
    timestamp: dayjs().valueOf(),
  });
}

/**
 * 计算年龄
 */
function calcAge(birthDate) {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * 解析 JSON 字段（兼容字符串和数组）
 */
function parseJsonField(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return []; }
  }
  return [];
}

module.exports = { ok, fail, calcAge, parseJsonField };
