// ============================================================
// 乐龄守护 · 健康知识服务
// 体质评估、节气养生、反诈知识、政策知识
// ============================================================
const pool = require('../db/mysql');

// ==================== 二十四节气近似日期映射 ====================
// 每月两个节气，近似日期（每年略有浮动，此处取大致范围）
const SOLAR_TERM_DATES = [
  { name: '小寒', month: 1, day: 5 }, { name: '大寒', month: 1, day: 20 },
  { name: '立春', month: 2, day: 4 }, { name: '雨水', month: 2, day: 19 },
  { name: '惊蛰', month: 3, day: 6 }, { name: '春分', month: 3, day: 21 },
  { name: '清明', month: 4, day: 5 }, { name: '谷雨', month: 4, day: 20 },
  { name: '立夏', month: 5, day: 5 }, { name: '小满', month: 5, day: 21 },
  { name: '芒种', month: 6, day: 6 }, { name: '夏至', month: 6, day: 21 },
  { name: '小暑', month: 7, day: 7 }, { name: '大暑', month: 7, day: 23 },
  { name: '立秋', month: 8, day: 7 }, { name: '处暑', month: 8, day: 23 },
  { name: '白露', month: 9, day: 8 }, { name: '秋分', month: 9, day: 23 },
  { name: '寒露', month: 10, day: 8 }, { name: '霜降', month: 10, day: 23 },
  { name: '立冬', month: 11, day: 7 }, { name: '小雪', month: 11, day: 22 },
  { name: '大雪', month: 12, day: 7 }, { name: '冬至', month: 12, day: 22 },
];

/**
 * 根据当前日期获取最近的节气名称
 */
function getCurrentSolarTermName() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // 将节气按日期排序，找到当前日期之前的最后一个节气
  let currentTerm = SOLAR_TERM_DATES[SOLAR_TERM_DATES.length - 1]; // 默认为冬至
  for (let i = SOLAR_TERM_DATES.length - 1; i >= 0; i--) {
    const term = SOLAR_TERM_DATES[i];
    if (month > term.month || (month === term.month && day >= term.day)) {
      currentTerm = term;
      break;
    }
  }
  return currentTerm.name;
}

/**
 * 解析 JSON 字段（兼容字符串和数组/对象）
 */
function parseJsonField(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

// ==================== 体质评估 ====================

/**
 * 获取老人体质评估历史
 */
async function getConstitutionAssessments(elderId) {
  const [rows] = await pool.query(
    'SELECT * FROM constitution_assessment WHERE elder_id = ? AND deleted = 0 ORDER BY assess_date DESC',
    [elderId]
  );
  return rows.map((r) => ({
    id: r.id,
    elderId: r.elder_id,
    assessDate: r.assess_date,
    constitution: r.constitution,
    score: r.score,
    features: parseJsonField(r.features),
    recommendations: parseJsonField(r.recommendations),
    assessedBy: r.assessed_by,
    gmtCreate: r.gmt_create,
    gmtModified: r.gmt_modified,
  }));
}

/**
 * 新增体质评估
 */
async function addConstitutionAssessment(data) {
  const { elderId, assessDate, constitution, score, features, recommendations, assessedBy } = data;
  const now = new Date();
  const [result] = await pool.query(
    `INSERT INTO constitution_assessment (elder_id, assess_date, constitution, score, features, recommendations, assessed_by, gmt_create, gmt_modified, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      elderId,
      assessDate || now,
      constitution,
      score || null,
      features ? JSON.stringify(features) : null,
      recommendations ? JSON.stringify(recommendations) : null,
      assessedBy || null,
      now,
      now,
    ]
  );
  return { id: result.insertId };
}

// ==================== 节气养生 ====================

/**
 * 获取节气养生信息
 * @param {string} termName - 节气名称，不传则获取当前节气
 */
async function getSolarTermHealth(termName) {
  const name = termName || getCurrentSolarTermName();
  const [rows] = await pool.query(
    'SELECT * FROM solar_term_health WHERE term_name = ? AND deleted = 0',
    [name]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    termName: r.term_name,
    termOrder: r.term_order,
    season: r.season,
    summary: r.summary,
    diet: parseJsonField(r.diet),
    exercise: parseJsonField(r.exercise),
    acupoints: parseJsonField(r.acupoints),
    lifestyle: r.lifestyle,
    recipes: parseJsonField(r.recipes),
    gmtCreate: r.gmt_create,
    gmtModified: r.gmt_modified,
  };
}

/**
 * 获取所有节气列表
 */
async function getSolarTermList() {
  const [rows] = await pool.query(
    'SELECT * FROM solar_term_health WHERE deleted = 0 ORDER BY term_order ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    termName: r.term_name,
    termOrder: r.term_order,
    season: r.season,
    summary: r.summary,
    diet: parseJsonField(r.diet),
    exercise: parseJsonField(r.exercise),
    acupoints: parseJsonField(r.acupoints),
    lifestyle: r.lifestyle,
    recipes: parseJsonField(r.recipes),
    gmtCreate: r.gmt_create,
    gmtModified: r.gmt_modified,
  }));
}

// ==================== 反诈知识 ====================

/**
 * 获取反诈知识
 * @param {string} category - 分类过滤，可选
 */
async function getAntiFraudKnowledge(category) {
  let sql = 'SELECT * FROM anti_fraud_knowledge WHERE deleted = 0';
  const params = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY gmt_create DESC';
  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    description: r.description,
    warningSigns: parseJsonField(r.warning_signs),
    prevention: r.prevention,
    riskLevel: r.risk_level,
    gmtCreate: r.gmt_create,
    gmtModified: r.gmt_modified,
  }));
}

/**
 * 新增反诈知识
 */
async function addAntiFraudKnowledge(data) {
  const { title, description, warning_signs, prevention, risk_level, category } = data;
  const now = new Date();
  const [result] = await pool.query(
    `INSERT INTO anti_fraud_knowledge (category, title, description, warning_signs, prevention, risk_level, gmt_create, gmt_modified, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      category || 'NETWORK',
      title,
      description,
      warning_signs ? JSON.stringify(warning_signs) : null,
      prevention || '',
      risk_level || 'MEDIUM',
      now,
      now,
    ]
  );
  return { id: result.insertId };
}

// ==================== 政策知识 ====================

/**
 * 获取政策知识
 * @param {string} category - 分类过滤，可选
 */
async function getPolicyKnowledge(category) {
  let sql = 'SELECT * FROM policy_knowledge WHERE deleted = 0';
  const params = [];
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY gmt_create DESC';
  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    title: r.title,
    summary: r.summary,
    detail: r.detail,
    applicableRegion: r.applicable_region,
    effectiveDate: r.effective_date,
    keywords: parseJsonField(r.keywords),
    gmtCreate: r.gmt_create,
    gmtModified: r.gmt_modified,
  }));
}

/**
 * 新增政策知识
 */
async function addPolicyKnowledge(data) {
  const { title, summary, detail, applicable_region, effective_date, keywords, category } = data;
  const now = new Date();
  const [result] = await pool.query(
    `INSERT INTO policy_knowledge (category, title, summary, detail, applicable_region, effective_date, keywords, gmt_create, gmt_modified, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      category || 'PENSION',
      title,
      summary,
      detail || null,
      applicable_region || null,
      effective_date || null,
      keywords ? JSON.stringify(keywords) : null,
      now,
      now,
    ]
  );
  return { id: result.insertId };
}

module.exports = {
  getConstitutionAssessments,
  addConstitutionAssessment,
  getSolarTermHealth,
  getSolarTermList,
  getAntiFraudKnowledge,
  addAntiFraudKnowledge,
  getPolicyKnowledge,
  addPolicyKnowledge,
  getCurrentSolarTermName,
};