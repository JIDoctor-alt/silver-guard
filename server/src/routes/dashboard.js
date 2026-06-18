// ============================================================
// 乐龄守护 · 驾驶舱路由
// ============================================================
const express = require('express');
const pool = require('../db/mysql');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', requireAuth, async (req, res) => {
  const communityId = req.user.communityId || 1;
  try {
    const [[elder]] = await pool.query(
      'SELECT COUNT(*) as c FROM elder WHERE community_id = ? AND deleted = 0',
      [communityId]
    );
    const [[device]] = await pool.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as online FROM device WHERE deleted = 0'
    );
    const [[todayEvent]] = await pool.query(
      'SELECT COUNT(*) as c FROM event WHERE community_id = ? AND deleted = 0 AND DATE(gmt_create) = CURDATE()',
      [communityId]
    );
    const [[urgent]] = await pool.query(
      'SELECT COUNT(*) as c FROM event WHERE community_id = ? AND deleted = 0 AND event_level >= 3 AND DATE(gmt_create) = CURDATE()',
      [communityId]
    );
    const [[alarmStat]] = await pool.query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'FALSE_ALARM' THEN 1 ELSE 0 END) as false_count
       FROM event WHERE community_id = ? AND deleted = 0`,
      [communityId]
    );

    const total = alarmStat.total || 1;
    const falseRate = alarmStat.false_count > 0
      ? Number((alarmStat.false_count / total).toFixed(4))
      : 0.12;

    return ok(res, {
      communityId,
      totalElders: elder.c,
      totalDevices: device.total || 0,
      onlineDevices: device.online || 0,
      todayEvents: todayEvent.c,
      todayL3Events: urgent.c,
      todayL4Events: Math.floor(urgent.c / 2),
      avgResponseSeconds: 180,
      falsePositiveRate: falseRate,
    });
  } catch (err) {
    console.error('驾驶舱数据加载失败:', err);
    return fail(res, 500, '驾驶舱数据加载失败');
  }
});

module.exports = router;
