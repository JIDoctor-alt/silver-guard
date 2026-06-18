// ============================================================
// Silver Guard · RAG 智能问答路由
// 基于知识库的检索增强生成（RAG）
// ============================================================
const express = require('express');
const ragService = require('../services/ragService');

const router = express.Router();

/**
 * POST /api/rag/chat
 * 同步问答：根据知识库生成回答（LLM 或关键词匹配）
 * Body: { question, elderName?, elderId? }
 */
router.post('/chat', async (req, res) => {
  try {
    const { question, elderName, elderId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ code: 400, message: '请输入您的问题', data: null });
    }

    const context = {};
    if (elderName) context.elderName = elderName;
    if (elderId) context.elderId = elderId;

    const result = await ragService.generateAnswer(question.trim(), context);
    res.json({ code: 0, message: '查询成功', data: result });
  } catch (e) {
    console.error('RAG 问答失败:', e.message);
    res.status(500).json({ code: 500, message: '问答服务异常，请稍后重试', data: null });
  }
});

/**
 * POST /api/rag/chat/stream
 * SSE 流式问答：逐字推送 AI 回答
 * Body: { question, elderName?, elderId? }
 */
router.post('/chat/stream', async (req, res) => {
  try {
    const { question, elderName, elderId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ code: 400, message: '请输入您的问题', data: null });
    }

    const context = {};
    if (elderName) context.elderName = elderName;
    if (elderId) context.elderId = elderId;

    const result = await ragService.generateAnswer(question.trim(), context);

  // SSE 流式响应
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // 逐字推送（模拟流式输出）
  const answer = result.answer;
  let index = 0;

  const streamInterval = setInterval(() => {
    if (index < answer.length) {
      // 按字符组推送，模拟流畅感
      const chunk = answer.slice(index, index + 3);
      res.write(`event: token\ndata: ${JSON.stringify({ content: chunk })}\n\n`);
      index += 3;
    } else {
      // 推送完毕，发送来源信息
      res.write(`event: sources\ndata: ${JSON.stringify({ sources: result.sources })}\n\n`);
      res.write(`event: done\ndata: ${JSON.stringify({ message: '回答完成' })}\n\n`);
      clearInterval(streamInterval);
      res.end();
    }
  }, 50);
  } catch (e) {
    console.error('RAG 流式问答失败:', e.message);
    res.writeHead(500, { 'Content-Type': 'text/event-stream' });
    res.write(`event: error\ndata: ${JSON.stringify({ message: '问答服务异常' })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/rag/search
 * 知识库检索（不生成回答，仅返回相关文档）
 * Query: ?q=关键词&topK=5
 */
router.get('/search', (req, res) => {
  const { q, topK } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ code: 400, message: '请输入搜索关键词', data: null });
  }

  const docs = ragService.retrieve(q.trim(), parseInt(topK) || 5);
  res.json({
    code: 0,
    message: '检索成功',
    data: { docs, total: docs.length },
  });
});

/**
 * GET /api/rag/categories
 * 获取知识库分类列表
 */
router.get('/categories', (req, res) => {
  const categories = ragService.getCategories();
  res.json({ code: 0, message: '获取成功', data: { categories } });
});

/**
 * GET /api/rag/knowledge
 * 获取知识库所有条目
 */
router.get('/knowledge', (req, res) => {
  res.json({
    code: 0,
    message: '获取成功',
    data: {
      items: ragService.KNOWLEDGE_BASE,
      total: ragService.KNOWLEDGE_BASE.length,
    },
  });
});

module.exports = router;