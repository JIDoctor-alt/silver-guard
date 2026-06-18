// ============================================================
// Silver Guard · JWT 认证中间件
// ============================================================
const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * 需要登录的接口
 */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录，请先登录', data: null });
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
    }
    return res.status(401).json({ code: 401, message: '无效的访问令牌', data: null });
  }
}

/**
 * 生成 JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}

module.exports = { requireAuth, generateToken };
