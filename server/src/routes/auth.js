// ============================================================
// Silver Guard · 认证路由
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/mysql');
const { requireAuth, generateToken } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return fail(res, 400, '手机号和密码不能为空');
  }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM user WHERE phone = ? AND deleted = 0',
      [phone]
    );
    if (rows.length === 0) {
      return fail(res, 401, '用户不存在');
    }
    const user = rows[0];
    if (user.status !== 1) {
      return fail(res, 403, '账号已被禁用');
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return fail(res, 401, '密码错误');
    }

    // 更新登录时间
    await pool.query('UPDATE user SET last_login_at = ? WHERE id = ?', [new Date(), user.id]);

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      realName: user.real_name,
      communityId: user.community_id,
    });

    return ok(res, {
      token,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        realName: user.real_name,
        role: user.role,
        communityId: user.community_id,
        status: user.status,
      },
    }, '登录成功');
  } catch (err) {
    console.error('登录失败:', err);
    return fail(res, 500, '服务器错误');
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, phone, real_name, role, community_id, status FROM user WHERE id = ? AND deleted = 0',
      [req.user.id]
    );
    if (rows.length === 0) {
      return fail(res, 404, '用户不存在');
    }
    const u = rows[0];
    return ok(res, {
      id: u.id,
      username: u.username,
      phone: u.phone,
      realName: u.real_name,
      role: u.role,
      communityId: u.community_id,
      status: u.status,
    });
  } catch (err) {
    return fail(res, 500, '服务器错误');
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return fail(res, 400, '旧密码和新密码不能为空');
  }
  if (newPassword.length < 6) {
    return fail(res, 400, '新密码长度不能少于6位');
  }
  try {
    const [rows] = await pool.query('SELECT password_hash FROM user WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(oldPassword, rows[0].password_hash);
    if (!valid) return fail(res, 401, '旧密码错误');

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE user SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    return ok(res, null, '密码修改成功');
  } catch (err) {
    return fail(res, 500, '服务器错误');
  }
});

module.exports = router;
