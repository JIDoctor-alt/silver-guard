// ============================================================
// 乐龄守护 · 健康记录服务
// ============================================================
const pool = require('../db/mysql');

/**
 * 获取老人指定天数内的健康记录
 * @param {number} elderId - 老人ID
 * @param {number} days - 最近天数，默认30天
 */
async function getHealthRecords(elderId, days = 30) {
  const [rows] = await pool.query(
    `SELECT id, elder_id, record_date, blood_pressure_sys, blood_pressure_dia,
            blood_glucose, heart_rate, blood_oxygen, body_temp,
            sleep_hours, steps, weight, tcm_constitution, mood, source, remark,
            gmt_create, gmt_modified
     FROM health_record
     WHERE elder_id = ? AND deleted = 0
       AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY record_date DESC`,
    [elderId, days]
  );
  return rows;
}

/**
 * 获取老人健康趋势数据（各指标按日期分组）
 * @param {number} elderId - 老人ID
 * @param {number} days - 最近天数，默认30天
 */
async function getHealthTrend(elderId, days = 30) {
  const [rows] = await pool.query(
    `SELECT record_date,
            blood_pressure_sys, blood_pressure_dia,
            blood_glucose, heart_rate, blood_oxygen, body_temp,
            sleep_hours, steps, weight
     FROM health_record
     WHERE elder_id = ? AND deleted = 0
       AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY record_date ASC`,
    [elderId, days]
  );

  const trend = {
    bloodPressure: [],
    glucose: [],
    heartRate: [],
    sleep: [],
    steps: [],
    weight: [],
    bloodOxygen: [],
    bodyTemp: [],
  };

  for (const row of rows) {
    const date = row.record_date;
    if (row.blood_pressure_sys != null && row.blood_pressure_dia != null) {
      trend.bloodPressure.push({
        date,
        sys: row.blood_pressure_sys,
        dia: row.blood_pressure_dia,
      });
    }
    if (row.blood_glucose != null) {
      trend.glucose.push({ date, value: row.blood_glucose });
    }
    if (row.heart_rate != null) {
      trend.heartRate.push({ date, value: row.heart_rate });
    }
    if (row.sleep_hours != null) {
      trend.sleep.push({ date, value: row.sleep_hours });
    }
    if (row.steps != null) {
      trend.steps.push({ date, value: row.steps });
    }
    if (row.weight != null) {
      trend.weight.push({ date, value: row.weight });
    }
    if (row.blood_oxygen != null) {
      trend.bloodOxygen.push({ date, value: row.blood_oxygen });
    }
    if (row.body_temp != null) {
      trend.bodyTemp.push({ date, value: row.body_temp });
    }
  }

  return trend;
}

/**
 * 新增一条健康记录
 * @param {object} data - 健康记录数据
 */
async function addHealthRecord(data) {
  const {
    elderId, recordDate,
    bloodPressureSys, bloodPressureDia,
    bloodGlucose, heartRate, bloodOxygen, bodyTemp,
    sleepHours, steps, weight,
    tcmConstitution, mood, source, remark,
  } = data;

  const now = new Date();

  const [result] = await pool.query(
    `INSERT INTO health_record
      (elder_id, record_date, blood_pressure_sys, blood_pressure_dia,
       blood_glucose, heart_rate, blood_oxygen, body_temp,
       sleep_hours, steps, weight,
       tcm_constitution, mood, source, remark,
       gmt_create, gmt_modified, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      elderId,
      recordDate || now,
      bloodPressureSys ?? null,
      bloodPressureDia ?? null,
      bloodGlucose ?? null,
      heartRate ?? null,
      bloodOxygen ?? null,
      bodyTemp ?? null,
      sleepHours ?? null,
      steps ?? null,
      weight ?? null,
      tcmConstitution || null,
      mood || null,
      source || null,
      remark || null,
      now,
      now,
    ]
  );

  return { id: result.insertId };
}

/**
 * 获取老人最新一条健康记录
 * @param {number} elderId - 老人ID
 */
async function getLatestHealth(elderId) {
  const [rows] = await pool.query(
    `SELECT id, elder_id, record_date, blood_pressure_sys, blood_pressure_dia,
            blood_glucose, heart_rate, blood_oxygen, body_temp,
            sleep_hours, steps, weight, tcm_constitution, mood, source, remark,
            gmt_create, gmt_modified
     FROM health_record
     WHERE elder_id = ? AND deleted = 0
     ORDER BY record_date DESC, id DESC
     LIMIT 1`,
    [elderId]
  );
  return rows[0] || null;
}

/**
 * 获取老人健康指标汇总统计（指定天数内的 AVG / MIN / MAX）
 * @param {number} elderId - 老人ID
 * @param {number} days - 统计天数，默认30天
 */
async function getHealthSummary(elderId, days = 30) {
  const [rows] = await pool.query(
    `SELECT
       COUNT(*) AS record_count,
       ROUND(AVG(blood_pressure_sys), 1) AS avg_bp_sys,
       ROUND(MIN(blood_pressure_sys), 1) AS min_bp_sys,
       ROUND(MAX(blood_pressure_sys), 1) AS max_bp_sys,
       ROUND(AVG(blood_pressure_dia), 1) AS avg_bp_dia,
       ROUND(MIN(blood_pressure_dia), 1) AS min_bp_dia,
       ROUND(MAX(blood_pressure_dia), 1) AS max_bp_dia,
       ROUND(AVG(blood_glucose), 1) AS avg_glucose,
       ROUND(MIN(blood_glucose), 1) AS min_glucose,
       ROUND(MAX(blood_glucose), 1) AS max_glucose,
       ROUND(AVG(heart_rate), 1) AS avg_heart_rate,
       ROUND(MIN(heart_rate), 1) AS min_heart_rate,
       ROUND(MAX(heart_rate), 1) AS max_heart_rate,
       ROUND(AVG(blood_oxygen), 1) AS avg_blood_oxygen,
       ROUND(MIN(blood_oxygen), 1) AS min_blood_oxygen,
       ROUND(MAX(blood_oxygen), 1) AS max_blood_oxygen,
       ROUND(AVG(body_temp), 1) AS avg_body_temp,
       ROUND(MIN(body_temp), 1) AS min_body_temp,
       ROUND(MAX(body_temp), 1) AS max_body_temp,
       ROUND(AVG(sleep_hours), 1) AS avg_sleep,
       ROUND(MIN(sleep_hours), 1) AS min_sleep,
       ROUND(MAX(sleep_hours), 1) AS max_sleep,
       ROUND(AVG(steps), 0) AS avg_steps,
       ROUND(MIN(steps), 0) AS min_steps,
       ROUND(MAX(steps), 0) AS max_steps,
       ROUND(AVG(weight), 1) AS avg_weight,
       ROUND(MIN(weight), 1) AS min_weight,
       ROUND(MAX(weight), 1) AS max_weight
     FROM health_record
     WHERE elder_id = ? AND deleted = 0
       AND record_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [elderId, days]
  );

  const r = rows[0];

  return {
    recordCount: r.record_count || 0,
    bloodPressure: {
      sys: { avg: r.avg_bp_sys, min: r.min_bp_sys, max: r.max_bp_sys },
      dia: { avg: r.avg_bp_dia, min: r.min_bp_dia, max: r.max_bp_dia },
    },
    glucose:      { avg: r.avg_glucose,      min: r.min_glucose,      max: r.max_glucose },
    heartRate:    { avg: r.avg_heart_rate,   min: r.min_heart_rate,   max: r.max_heart_rate },
    bloodOxygen:  { avg: r.avg_blood_oxygen, min: r.min_blood_oxygen, max: r.max_blood_oxygen },
    bodyTemp:     { avg: r.avg_body_temp,    min: r.min_body_temp,    max: r.max_body_temp },
    sleep:        { avg: r.avg_sleep,        min: r.min_sleep,        max: r.max_sleep },
    steps:        { avg: r.avg_steps,        min: r.min_steps,        max: r.max_steps },
    weight:       { avg: r.avg_weight,       min: r.min_weight,       max: r.max_weight },
  };
}

module.exports = {
  getHealthRecords,
  getHealthTrend,
  addHealthRecord,
  getLatestHealth,
  getHealthSummary,
};