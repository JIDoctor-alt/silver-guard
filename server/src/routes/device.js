// ============================================================
// 乐龄守护 · 设备管理路由
// ============================================================
const express = require('express');
const pool = require('../db/mysql');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');

const router = express.Router();

// GET /api/device/list — 设备列表（分页）
router.get('/list', requireAuth, async (req, res) => {
  const { page = 1, size = 20, elderId, status } = req.query;
  const pageSize = Math.min(Number(size), 100);
  const offset = (Number(page) - 1) * pageSize;

  try {
    let where = 'WHERE deleted = 0';
    const params = [];
    if (elderId) { where += ' AND elder_id = ?'; params.push(Number(elderId)); }
    if (status !== undefined) { where += ' AND status = ?'; params.push(Number(status)); }

    const [rows] = await pool.query(
      `SELECT * FROM device ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM device ${where}`, params);

    return ok(res, {
      records: rows.map((r) => ({
        id: r.id,
        elderId: r.elder_id,
        deviceType: r.device_type,
        vendor: r.vendor,
        sn: r.sn,
        name: r.name,
        location: r.location,
        status: r.status,
        offlineCount: r.offline_count,
        gmtCreate: r.gmt_create,
      })),
      total,
    });
  } catch (err) {
    console.error('查询设备列表失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/device/:id — 设备详情
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM device WHERE id = ? AND deleted = 0', [req.params.id]);
    if (rows.length === 0) return fail(res, 404, '设备不存在');
    return ok(res, rows[0]);
  } catch (err) {
    return fail(res, 500, '查询失败');
  }
});

// POST /api/device — 新增设备
router.post('/', requireAuth, async (req, res) => {
  const { elderId, deviceType, vendor, sn, name, location, thresholdJson } = req.body;
  if (!elderId || !deviceType || !sn) return fail(res, 400, '老人ID、设备类型、序列号不能为空');
  try {
    const [result] = await pool.query(
      `INSERT INTO device (elder_id, device_type, vendor, sn, name, location, threshold_json, status, offline_count, gmt_create, gmt_modified, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, 0)`,
      [elderId, deviceType, vendor || '', sn, name || '', location || '',
       thresholdJson ? JSON.stringify(thresholdJson) : null, new Date(), new Date()]
    );
    return ok(res, { id: result.insertId }, '设备添加成功');
  } catch (err) {
    console.error('添加设备失败:', err);
    return fail(res, 500, '添加失败');
  }
});

// PUT /api/device/:id — 更新设备
router.put('/:id', requireAuth, async (req, res) => {
  const { name, location, status, thresholdJson } = req.body;
  const fields = [];
  const params = [];
  if (name !== undefined) { fields.push('name = ?'); params.push(name); }
  if (location !== undefined) { fields.push('location = ?'); params.push(location); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (thresholdJson !== undefined) { fields.push('threshold_json = ?'); params.push(JSON.stringify(thresholdJson)); }
  if (fields.length === 0) return fail(res, 400, '没有需要更新的字段');
  fields.push('gmt_modified = ?');
  params.push(new Date(), req.params.id);
  try {
    await pool.query(`UPDATE device SET ${fields.join(', ')} WHERE id = ?`, params);
    return ok(res, null, '更新成功');
  } catch (err) {
    return fail(res, 500, '更新失败');
  }
});

// DELETE /api/device/:id — 删除设备
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE device SET deleted = 1, gmt_modified = ? WHERE id = ?', [new Date(), req.params.id]);
    return ok(res, null, '删除成功');
  } catch (err) {
    return fail(res, 500, '删除失败');
  }
});

module.exports = router;
