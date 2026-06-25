// ============================================================
// Silver Guard · AI 音乐陪伴路由
// 作曲、作词、广场舞曲推荐与生成
// ============================================================
const express = require('express');
const aiService = require('../services/aiService');

const router = express.Router();

/**
 * GET /api/music/dance
 * 推荐广场舞曲
 * Query: ?tempo=中速&genre=民族风&tag=热门&limit=10
 */
router.get('/dance', (req, res) => {
  const { tempo, genre, tag, limit } = req.query;
  const songs = aiService.recommendDanceMusic({
    tempo,
    genre,
    tag,
    limit: parseInt(limit) || 10,
  });
  res.json({ code: 0, message: '推荐成功', data: { songs, total: songs.length } });
});

/**
 * POST /api/music/compose
 * AI 作曲（LLM 生成，无 API 时降级为模板）
 * Body: { theme, tempo, style, mood }
 */
router.post('/compose', async (req, res) => {
  try {
    const { theme, tempo, style, mood } = req.body;
    const music = await aiService.composeMusic({ theme, tempo, style, mood });
    res.json({ code: 0, message: '作曲成功', data: music });
  } catch (e) {
    console.error('作曲失败:', e.message);
    res.status(500).json({ code: 500, message: '作曲失败，请稍后重试', data: null });
  }
});

/**
 * POST /api/music/lyrics
 * AI 作词（LLM 生成，无 API 时降级为模板）
 * Body: { theme, genre }
 */
router.post('/lyrics', async (req, res) => {
  try {
    const { theme, genre } = req.body;
    const lyrics = await aiService.composeLyrics({ theme, genre });
    res.json({ code: 0, message: '作词成功', data: lyrics });
  } catch (e) {
    console.error('作词失败:', e.message);
    res.status(500).json({ code: 500, message: '作词失败，请稍后重试', data: null });
  }
});

/**
 * POST /api/music/lyrics/stream
 * AI 流式作词（SSE 逐 token 推送）
 * Body: { theme, genre }
 */
router.post('/lyrics/stream', async (req, res) => {
  try {
    const { theme, genre } = req.body;

    // SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const onToken = (token) => {
      res.write(`event: token\ndata: ${JSON.stringify({ content: token })}\n\n`);
    };

    const result = await aiService.composeLyricsStream({ theme, genre }, onToken);

    res.write(`event: done\ndata: ${JSON.stringify(result)}\n\n`);
    res.end();
  } catch (e) {
    console.error('流式作词失败:', e.message);
    res.writeHead(500, { 'Content-Type': 'text/event-stream' });
    res.write(`event: error\ndata: ${JSON.stringify({ message: '作词服务异常' })}\n\n`);
    res.end();
  }
});

/**
 * GET /api/music/categories
 * 获取音乐分类信息
 */
router.get('/categories', (req, res) => {
  const categories = aiService.getMusicCategories();
  res.json({ code: 0, message: '获取成功', data: categories });
});

module.exports = router;