// ============================================================
// 乐龄守护 · 路由汇总
// ============================================================
const express = require('express');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const elderRouter = require('./elder');
const eventRouter = require('./event');
const deviceRouter = require('./device');
const patrolRouter = require('./patrol');
const sseRouter = require('./sse');
const ragRouter = require('./rag');
const musicRouter = require('./music');
const squareRouter = require('./square');
const healthRouter = require('./health');
const knowledgeRouter = require('./knowledge');
const readingRouter = require('./reading');
const systemConfigRouter = require('./systemConfig');
const amapRouter = require('./amap');

const router = express.Router();

// 认证
router.use('/auth', authRouter);

// 驾驶舱
router.use('/dashboard', dashboardRouter);

// 老人档案
router.use('/elder', elderRouter);

// 预警事件
router.use('/event', eventRouter);

// 设备管理
router.use('/device', deviceRouter);

// 巡检记录
router.use('/patrol', patrolRouter);

// SSE 实时推送
router.use('/sse', sseRouter);

// RAG 智能问答
router.use('/rag', ragRouter);

// AI 音乐陪伴
router.use('/music', musicRouter);

// 银龄广场
router.use('/square', squareRouter);

// 高德地图
router.use('/amap', amapRouter);

// 健康记录
router.use('/health', healthRouter);

// 知识库（体质/节气/反诈/政策）
router.use('/knowledge', knowledgeRouter);

// 经典阅读
router.use('/reading', readingRouter);

// 系统配置（大模型配置/提示词配置）
router.use('/system-config', systemConfigRouter);

module.exports = router;
