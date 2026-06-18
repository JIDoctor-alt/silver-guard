// ============================================================
// 乐龄守护 · 巡检记录路由
// ============================================================
const express = require('express');
const pool = require('../db/mysql');
const { requireAuth } = require('../middleware/auth');
const { ok, fail, parseJsonField } = require('../middleware/response');

const router = express.Router();

// GET /api/patrol/page — 巡检记录列表
router.get('/page', requireAuth, async (req, res) => {
  const { cursor, size = 20, elderId, userId } = req.query;
  const communityId = req.user.communityId || 1;
  const pageSize = Math.min(Number(size), 100);

  try {
    let sql = 'SELECT * FROM patrol_record WHERE community_id = ? AND deleted = 0';
    const params = [communityId];
    if (elderId) { sql += ' AND elder_id = ?'; params.push(Number(elderId)); }
    if (userId) { sql += ' AND user_id = ?'; params.push(Number(userId)); }
    if (cursor) { sql += ' AND id < ?'; params.push(Number(cursor)); }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(pageSize + 1);

    const [rows] = await pool.query(sql, params);
    const hasMore = rows.length > pageSize;
    const records = rows.slice(0, pageSize).map((r) => ({
      id: r.id,
      elderId: r.elder_id,
      userId: r.user_id,
      taskType: r.task_type,
      checkinAt: r.checkin_at,
      elderStatus: r.elder_status,
      remark: r.remark,
      photos: parseJsonField(r.photos),
      followUpFlag: Boolean(r.follow_up_flag),
    }));

    return ok(res, { records, nextCursor: hasMore ? records[records.length - 1].id : null, size: pageSize, hasMore });
  } catch (err) {
    console.error('查询巡检记录失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// POST /api/patrol — 新增巡检记录
router.post('/', requireAuth, async (req, res) => {
  const { elderId, taskType, elderStatus, remark, photos, followUpFlag = false, locationLat, locationLng } = req.body;
  if (!elderId || !taskType || !elderStatus) return fail(res, 400, '老人ID、任务类型、老人状态不能为空');
  try {
    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO patrol_record (elder_id, user_id, task_type, checkin_at, elder_status, remark, photos, follow_up_flag, location_lat, location_lng, community_id, gmt_create, gmt_modified, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [elderId, req.user.id, taskType, now, elderStatus, remark || '', photos ? JSON.stringify(photos) : null,
       followUpFlag ? 1 : 0, locationLat || null, locationLng || null, req.user.communityId || 1, now, now]
    );
    return ok(res, { id: result.insertId }, '巡检记录创建成功');
  } catch (err) {
    console.error('创建巡检记录失败:', err);
    return fail(res, 500, '创建失败');
  }
});

module.exports = router;
