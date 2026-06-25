// ============================================================
// 乐龄守护 · 健康记录路由
// ============================================================
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');
const healthService = require('../services/healthService');

const router = express.Router();

// GET /api/health/records — 获取健康记录列表
router.get('/records', requireAuth, async (req, res) => {
  try {
    const elderId = Number(req.query.elderId);
    const days = Number(req.query.days) || 30;

    if (!elderId) {
      return fail(res, 400, 'elderId 不能为空');
    }

    const records = await healthService.getHealthRecords(elderId, days);
    return ok(res, { records, total: records.length });
  } catch (err) {
    console.error('查询健康记录失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/health/trend — 获取健康趋势数据
router.get('/trend', requireAuth, async (req, res) => {
  try {
    const elderId = Number(req.query.elderId);
    const days = Number(req.query.days) || 30;

    if (!elderId) {
      return fail(res, 400, 'elderId 不能为空');
    }

    const trend = await healthService.getHealthTrend(elderId, days);
    return ok(res, trend);
  } catch (err) {
    console.error('查询健康趋势失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/health/latest — 获取最新健康记录
router.get('/latest', requireAuth, async (req, res) => {
  try {
    const elderId = Number(req.query.elderId);

    if (!elderId) {
      return fail(res, 400, 'elderId 不能为空');
    }

    const record = await healthService.getLatestHealth(elderId);
    if (!record) {
      return fail(res, 404, '暂无健康记录');
    }

    return ok(res, record);
  } catch (err) {
    console.error('查询最新健康记录失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/health/summary — 获取健康指标汇总
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const elderId = Number(req.query.elderId);
    const days = Number(req.query.days) || 30;

    if (!elderId) {
      return fail(res, 400, 'elderId 不能为空');
    }

    const summary = await healthService.getHealthSummary(elderId, days);
    return ok(res, summary);
  } catch (err) {
    console.error('查询健康汇总失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// POST /api/health/records — 新增健康记录
router.post('/records', requireAuth, async (req, res) => {
  try {
    const {
      elderId, recordDate,
      bloodPressureSys, bloodPressureDia,
      bloodGlucose, heartRate, bloodOxygen, bodyTemp,
      sleepHours, steps, weight,
      tcmConstitution, mood, source, remark,
    } = req.body;

    if (!elderId) {
      return fail(res, 400, 'elderId 不能为空');
    }

    const result = await healthService.addHealthRecord({
      elderId,
      recordDate,
      bloodPressureSys,
      bloodPressureDia,
      bloodGlucose,
      heartRate,
      bloodOxygen,
      bodyTemp,
      sleepHours,
      steps,
      weight,
      tcmConstitution,
      mood,
      source,
      remark,
    });

    return ok(res, result, '新增成功');
  } catch (err) {
    console.error('新增健康记录失败:', err);
    return fail(res, 500, '新增失败');
  }
});

module.exports = router;