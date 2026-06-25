// ============================================================
// 乐龄守护 · 知识中心路由
// 体质评估、节气养生、反诈知识、政策知识
// ============================================================
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');
const knowledgeService = require('../services/knowledgeService');

const router = express.Router();

// ==================== 体质评估 ====================

// GET /api/knowledge/constitution - 获取老人体质评估历史
router.get('/constitution', requireAuth, async (req, res) => {
  try {
    const { elderId } = req.query;
    if (!elderId) {
      return fail(res, 400, '缺少老人ID');
    }
    const assessments = await knowledgeService.getConstitutionAssessments(Number(elderId));
    return ok(res, assessments);
  } catch (err) {
    console.error('查询体质评估历史失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// POST /api/knowledge/constitution - 新增体质评估
router.post('/constitution', requireAuth, async (req, res) => {
  try {
    const { elderId, assessDate, constitution, score, features, recommendations, assessedBy } = req.body;
    if (!elderId || !constitution) {
      return fail(res, 400, '老人ID和体质类型不能为空');
    }
    const result = await knowledgeService.addConstitutionAssessment({
      elderId: Number(elderId),
      assessDate,
      constitution,
      score: score ? Number(score) : null,
      features,
      recommendations,
      assessedBy: assessedBy ? Number(assessedBy) : null,
    });
    return ok(res, result, '添加成功');
  } catch (err) {
    console.error('新增体质评估失败:', err);
    return fail(res, 500, '添加失败');
  }
});

// ==================== 节气养生 ====================

// GET /api/knowledge/solar-term - 获取节气养生信息
router.get('/solar-term', requireAuth, async (req, res) => {
  try {
    const { termName } = req.query;
    const info = await knowledgeService.getSolarTermHealth(termName);
    if (!info) {
      return fail(res, 404, '未找到该节气养生信息');
    }
    return ok(res, info);
  } catch (err) {
    console.error('查询节气养生信息失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/knowledge/solar-term/list - 获取所有节气列表
router.get('/solar-term/list', requireAuth, async (req, res) => {
  try {
    const list = await knowledgeService.getSolarTermList();
    return ok(res, list);
  } catch (err) {
    console.error('查询节气列表失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// ==================== 反诈知识 ====================

// GET /api/knowledge/anti-fraud - 获取反诈知识
router.get('/anti-fraud', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const knowledge = await knowledgeService.getAntiFraudKnowledge(category);
    return ok(res, knowledge);
  } catch (err) {
    console.error('查询反诈知识失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// POST /api/knowledge/anti-fraud - 新增反诈知识
router.post('/anti-fraud', requireAuth, async (req, res) => {
  try {
    const { title, description, warning_signs, prevention, risk_level, category } = req.body;
    if (!title || !description) {
      return fail(res, 400, '标题和描述不能为空');
    }
    const result = await knowledgeService.addAntiFraudKnowledge({
      title,
      description,
      warning_signs: warning_signs || [],
      prevention: prevention || '',
      risk_level: risk_level || 'MEDIUM',
      category: category || 'NETWORK',
    });
    return ok(res, result, '添加成功');
  } catch (err) {
    console.error('新增反诈知识失败:', err);
    return fail(res, 500, '添加失败');
  }
});

// ==================== 政策知识 ====================

// GET /api/knowledge/policy - 获取政策知识
router.get('/policy', requireAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const knowledge = await knowledgeService.getPolicyKnowledge(category);
    return ok(res, knowledge);
  } catch (err) {
    console.error('查询政策知识失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// POST /api/knowledge/policy - 新增政策知识
router.post('/policy', requireAuth, async (req, res) => {
  try {
    const { title, summary, detail, applicable_region, effective_date, keywords, category } = req.body;
    if (!title || !summary) {
      return fail(res, 400, '标题和摘要不能为空');
    }
    const result = await knowledgeService.addPolicyKnowledge({
      title,
      summary,
      detail,
      applicable_region,
      effective_date,
      keywords: keywords || [],
      category: category || 'PENSION',
    });
    return ok(res, result, '添加成功');
  } catch (err) {
    console.error('新增政策知识失败:', err);
    return fail(res, 500, '添加失败');
  }
});

module.exports = router;