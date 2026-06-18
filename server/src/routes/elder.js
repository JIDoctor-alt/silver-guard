// ============================================================
// Silver Guard · 老人档案路由
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/mysql');
const { requireAuth } = require('../middleware/auth');
const { ok, fail, calcAge, parseJsonField } = require('../middleware/response');

const router = express.Router();

// GET /api/elder/page — 老人列表（游标分页）
router.get('/page', requireAuth, async (req, res) => {
  const { riskLevel, cursor, size = 20 } = req.query;
  const communityId = req.user.communityId || 1;
  const pageSize = Math.min(Number(size), 100);

  try {
    let sql = 'SELECT * FROM elder WHERE community_id = ? AND deleted = 0';
    const params = [communityId];
    if (riskLevel) { sql += ' AND risk_level = ?'; params.push(Number(riskLevel)); }
    if (cursor) { sql += ' AND id < ?'; params.push(Number(cursor)); }
    sql += ' ORDER BY id DESC LIMIT ?';
    params.push(pageSize + 1);

    const [rows] = await pool.query(sql, params);
    const hasMore = rows.length > pageSize;
    const records = rows.slice(0, pageSize).map((r) => ({
      id: r.id,
      name: r.name,
      gender: r.gender,
      age: calcAge(r.birth_date),
      communityId: r.community_id,
      riskLevel: r.risk_level,
      tags: parseJsonField(r.tags),
      status: r.status,
      gridUserName: '网格员',
      guardianPhones: [],
    }));

    return ok(res, {
      records,
      nextCursor: hasMore ? records[records.length - 1].id : null,
      size: pageSize,
      hasMore,
    });
  } catch (err) {
    console.error('查询老人列表失败:', err);
    return fail(res, 500, '查询失败');
  }
});

// GET /api/elder/:id — 老人详情
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM elder WHERE id = ? AND deleted = 0',
      [req.params.id]
    );
    if (rows.length === 0) return fail(res, 404, '老人不存在');
    const r = rows[0];
    return ok(res, {
      id: r.id,
      name: r.name,
      gender: r.gender,
      age: calcAge(r.birth_date),
      birthDate: r.birth_date,
      phone: r.phone,
      communityId: r.community_id,
      address: r.address,
      riskLevel: r.risk_level,
      tags: parseJsonField(r.tags),
      status: r.status,
      gridUserId: r.grid_user_id,
      guardianUserId: r.guardian_user_id,
    });
  } catch (err) {
    return fail(res, 500, '查询失败');
  }
});

// POST /api/elder — 新增老人
router.post('/', requireAuth, async (req, res) => {
  const { name, gender, birthDate, phone, address, riskLevel = 1, tags = [], guardianUserId, gridUserId } = req.body;
  if (!name || !gender || !birthDate) {
    return fail(res, 400, '姓名、性别、出生日期不能为空');
  }
  try {
    const idCardHash = bcrypt.hashSync(name + (phone || ''), 1).substring(0, 64);
    const now = new Date();
    const [result] = await pool.query(
      `INSERT INTO elder (name, id_card_hash, gender, birth_date, phone, community_id, address, risk_level, tags, status, grid_user_id, guardian_user_id, consent_signed, consent_signed_at, gmt_create, gmt_modified, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 1, ?, ?, ?, 0)`,
      [name, idCardHash, gender, birthDate, phone || '', req.user.communityId || 1, address || '', riskLevel,
       JSON.stringify(tags), gridUserId || 1, guardianUserId || null, now, now, now]
    );
    return ok(res, { id: result.insertId }, '创建成功');
  } catch (err) {
    console.error('创建老人档案失败:', err);
    return fail(res, 500, '创建失败');
  }
});

// PUT /api/elder/:id — 更新老人
router.put('/:id', requireAuth, async (req, res) => {
  const { riskLevel, tags, status, address, phone, guardianUserId, gridUserId } = req.body;
  const fields = [];
  const params = [];
  if (riskLevel !== undefined) { fields.push('risk_level = ?'); params.push(riskLevel); }
  if (tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(tags)); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (address !== undefined) { fields.push('address = ?'); params.push(address); }
  if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
  if (guardianUserId !== undefined) { fields.push('guardian_user_id = ?'); params.push(guardianUserId); }
  if (gridUserId !== undefined) { fields.push('grid_user_id = ?'); params.push(gridUserId); }
  if (fields.length === 0) return fail(res, 400, '没有需要更新的字段');

  fields.push('gmt_modified = ?');
  params.push(new Date(), req.params.id);

  try {
    await pool.query(`UPDATE elder SET ${fields.join(', ')} WHERE id = ? AND deleted = 0`, params);
    return ok(res, null, '更新成功');
  } catch (err) {
    return fail(res, 500, '更新失败');
  }
});

// DELETE /api/elder/:id — 删除老人（软删除）
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE elder SET deleted = 1, gmt_modified = ? WHERE id = ?',
      [new Date(), req.params.id]
    );
    if (result.affectedRows === 0) return fail(res, 404, '老人不存在');
    return ok(res, null, '删除成功');
  } catch (err) {
    return fail(res, 500, '删除失败');
  }
});

module.exports = router;
