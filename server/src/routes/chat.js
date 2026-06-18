// ============================================================
// 乐龄守护 · RAG + SSE 智能问答路由
// 支持：
// 1. POST /api/chat - 同步问答（普通响应）
// 2. GET /api/chat/stream - SSE 流式响应（实时推送）
// 3. POST /api/chat/document - 添加知识库文档
// 4. GET /api/chat/search - 文档检索
// ============================================================
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');
const ragService = require('../services/rag');

router.post('/', requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return fail(res, 400, '请输入问题');

  try {
    const result = await ragService.queryRAG(message);
    return ok(res, {
      answer: result.answer,
      sources: result.sources,
      isMock: result.isMock,
    });
  } catch (error) {
    console.error('[Chat] 问答失败:', error);
    return fail(res, 500, '服务暂时不可用');
  }
});

router.get('/stream', requireAuth, async (req, res) => {
  const { message } = req.query;
  if (!message) return fail(res, 400, '请输入问题');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const sendChunk = (data) => {
    res.write(`data: ${JSON.stringify({ type: 'chunk', content: data })}\n\n`);
  };

  const sendEnd = (result) => {
    res.write(`data: ${JSON.stringify({ type: 'end', ...result })}\n\n`);
    res.end();
  };

  req.on('close', () => {
    console.log('[SSE] 客户端断开连接');
    res.end();
  });

  try {
    const result = await ragService.streamChat(message, sendChunk);
    sendEnd({
      answer: result.answer,
      sources: result.sources,
      isMock: result.isMock,
    });
  } catch (error) {
    console.error('[SSE] 流式响应失败:', error);
    sendEnd({
      answer: '服务暂时不可用，请稍后重试',
      sources: [],
      isMock: true,
    });
  }
});

router.post('/document', requireAuth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return fail(res, 400, '标题和内容不能为空');

  const result = await ragService.addDocument(title, content);
  if (result.success) {
    return ok(res, null, result.message);
  } else {
    return fail(res, 500, result.message);
  }
});

router.get('/search', requireAuth, async (req, res) => {
  const { query, limit = 5 } = req.query;
  if (!query) return fail(res, 400, '请输入搜索关键词');

  try {
    const results = await ragService.searchDocuments(query, Number(limit));
    return ok(res, { results });
  } catch (error) {
    console.error('[Search] 检索失败:', error);
    return fail(res, 500, '检索失败');
  }
});

module.exports = router;
