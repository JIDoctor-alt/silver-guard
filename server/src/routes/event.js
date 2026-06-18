// ============================================================
// Silver Guard · 预警事件路由
// ============================================================
const express = require('express');
const pool = require('../db/mysql');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');

const router = express.Router();

// GET /api/event/page — 事件列表（游标分页）
router.get('/page', requireAuth, async (req, res) => {
  const { status, eventLevel, cursor, size = 20 } = req.query;
  const communityId = req.user.communityId || 1;
  const pageSize = Math.min(Number(size), 100);

  try {
    let sql = 'SELECT * FROM event WHERE community_id = ? AND deleted = 0';
    const params = [communityId];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (eventLevel) { sql += ' AND event_level = ?'; params.push(Number(eventLevel)); }
    if (cursor) { sql += ' AND id < ?'; params.push(Number(cursor)); }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(pageSize + 1);

    const [rows] = await pool.query(sql, params);
    const hasMore = rows.length > pageSize;
    const records = rows.slice(0, pageSize).map((r) => ({
      id: r.id,
      elderId: r.elder_id,
      deviceId: r.device_id,
      eventType: r.event_type,
      eventLevel: r.event_level,
      confidence: Number(r.confidence),
      source: r.source,
      status: r.status,
      assignedUserId: r.assigned_user_id,
      closedBy: r.closed_by,
      closedAt: r.closed_at,
      closeReason: r.close_reason,
      communityId: r.community_id,
      gmtCreate: r.gmt_create,
    }));

    return ok(res, { records, nextCursor: hasMore ? records[records.length - 1].id : null, size: pageSize, hasMore });
  } catch (err) {
    console.error('查询事件列表失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/event/:id — 事件详情
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM event WHERE id = ? AND deleted = 0', [req.params.id]);
    if (rows.length === 0) return fail(res, 404, '事件不存在');
    const r = rows[0];
    return ok(res, {
      id: r.id,
      elderId: r.elder_id,
      deviceId: r.device_id,
      eventType: r.event_type,
      eventLevel: r.event_level,
      confidence: Number(r.confidence),
      source: r.source,
      evidenceJson: r.evidence_json,
      aiExplanation: r.ai_explanation,
      firstReportAt: r.first_report_at,
      status: r.status,
      assignedUserId: r.assigned_user_id,
      closedBy: r.closed_by,
      closedAt: r.closed_at,
      closeReason: r.close_reason,
      communityId: r.community_id,
      gmtCreate: r.gmt_create,
    });
  } catch (err) {
    return fail(res, 500, '查询失败');
  }
});

// PUT /api/event/:id/assign — 分配事件
router.put('/:id/assign', requireAuth, async (req, res) => {
  const userId = req.body.userId || req.user.id;
  try {
    await pool.query(
      'UPDATE event SET status = ?, assigned_user_id = ?, gmt_modified = ? WHERE id = ?',
      ['ASSIGNED', userId, new Date(), req.params.id]
    );
    return ok(res, null, '已分配');
  } catch (err) {
    return fail(res, 500, '分配失败');
  }
});

// PUT /api/event/:id/handle — 处理事件
router.put('/:id/handle', requireAuth, async (req, res) => {
  const { closeReason = '已处理' } = req.body;
  try {
    await pool.query(
      'UPDATE event SET status = ?, closed_by = ?, closed_at = ?, close_reason = ?, gmt_modified = ? WHERE id = ?',
      ['CLOSED', req.user.id, new Date(), closeReason, new Date(), req.params.id]
    );
    return ok(res, null, '已处理');
  } catch (err) {
    return fail(res, 500, '处理失败');
  }
});

// PUT /api/event/:id/false-alarm — 标记误报
router.put('/:id/false-alarm', requireAuth, async (req, res) => {
  const { reason = '误报' } = req.body;
  try {
    await pool.query(
      'UPDATE event SET status = ?, closed_by = ?, closed_at = ?, close_reason = ?, gmt_modified = ? WHERE id = ?',
      ['FALSE_ALARM', req.user.id, new Date(), reason, new Date(), req.params.id]
    );
    return ok(res, null, '已标记误报');
  } catch (err) {
    return fail(res, 500, '操作失败');
  }
});

module.exports = router;
