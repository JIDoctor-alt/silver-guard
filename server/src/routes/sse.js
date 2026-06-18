// ============================================================
// Silver Guard · SSE 实时推送路由
// 客户端通过 EventSource 连接接收实时事件
// ============================================================
const express = require('express');
const sseManager = require('../services/sseManager');

const router = express.Router();

/**
 * GET /api/sse/connect
 * 建立 SSE 连接，接收实时事件推送
 * Query: ?token=xxx (JWT token for auth)
 */
router.get('/connect', (req, res) => {
  // 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
  });

  // 发送初始连接确认
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE 连接成功', timestamp: new Date().toISOString() })}\n\n`);

  // 心跳保活（每30秒）
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 30000);

  // 获取用户ID（从请求参数或认证中间件）
  const userId = req.query.userId || 'anonymous';

  sseManager.addClient(userId, res);

  // 客户端断开时清理
  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(userId, res);
  });
});

/**
 * POST /api/sse/trigger
 * 手动触发事件推送（用于测试或内部调用）
 * Body: { eventType, data, userId, communityId }
 */
router.post('/trigger', (req, res) => {
  const { eventType, data, userId, communityId } = req.body;

  if (!eventType || !data) {
    return res.status(400).json({ code: 400, message: '缺少 eventType 或 data', data: null });
  }

  if (userId) {
    sseManager.sendToUser(userId, eventType, data);
  } else if (communityId) {
    sseManager.sendToCommunity(communityId, eventType, data);
  } else {
    sseManager.broadcast(eventType, data);
  }

  res.json({ code: 0, message: '事件已推送', data: { connectionCount: sseManager.getConnectionCount() } });
});

/**
 * GET /api/sse/status
 * 获取 SSE 服务状态
 */
router.get('/status', (req, res) => {
  res.json({
    code: 0,
    message: 'SSE 服务运行中',
    data: {
      connections: sseManager.getConnectionCount(),
      uptime: process.uptime(),
    },
  });
});

module.exports = router;