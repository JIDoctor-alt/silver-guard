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
<<<<<<< HEAD
const musicRouter = require('./music');
const chatRouter = require('./chat');
=======
const sseRouter = require('./sse');
const ragRouter = require('./rag');
const musicRouter = require('./music');
>>>>>>> 8a79316 (feat: SSE/RAG/音乐智能体 + 提示词配置系统)

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

<<<<<<< HEAD
// 音乐创作（作曲/作词）
router.use('/music', musicRouter);

// RAG 智能问答（含 SSE 流式响应）
router.use('/chat', chatRouter);

=======
// SSE 实时推送
router.use('/sse', sseRouter);

// RAG 智能问答
router.use('/rag', ragRouter);

// AI 音乐陪伴
router.use('/music', musicRouter);

>>>>>>> 8a79316 (feat: SSE/RAG/音乐智能体 + 提示词配置系统)
module.exports = router;
