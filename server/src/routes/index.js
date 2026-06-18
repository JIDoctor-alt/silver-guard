// ============================================================
// Silver Guard · 路由汇总
// ============================================================
const express = require('express');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const elderRouter = require('./elder');
const eventRouter = require('./event');
const deviceRouter = require('./device');
const patrolRouter = require('./patrol');

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

module.exports = router;
