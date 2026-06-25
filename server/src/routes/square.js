// ============================================================
// Silver Guard · 银龄广场路由
// 广场舞教学、社区活动管理、音乐创作知识库
// ============================================================
const express = require('express');
const squareService = require('../services/squareService');

const router = express.Router();

// ==================== 广场舞步法 ====================

/**
 * GET /api/square/dance-steps
 * 获取所有广场舞步法列表
 * Query: ?category=基础步法
 */
router.get('/dance-steps', (req, res) => {
  const { category } = req.query;
  let result;
  if (category) {
    result = { steps: squareService.getDanceStepsByCategory(category), total: squareService.getDanceStepsByCategory(category).length };
  } else {
    result = squareService.getDanceSteps();
  }
  res.json({ code: 0, message: '获取成功', data: result });
});

/**
 * GET /api/square/dance-steps/:id
 * 获取单个步法详情
 */
router.get('/dance-steps/:id', (req, res) => {
  const step = squareService.getDanceStepById(Number(req.params.id));
  if (!step) return res.status(404).json({ code: 404, message: '步法不存在', data: null });
  res.json({ code: 0, message: '获取成功', data: step });
});

/**
 * GET /api/square/dance-songs
 * 获取扩展广场舞曲库
 */
router.get('/dance-songs', (req, res) => {
  const result = squareService.getExtendedDanceMusic();
  res.json({ code: 0, message: '获取成功', data: result });
});

// ==================== 社区活动 ====================

/**
 * GET /api/square/activities
 * 获取活动列表
 * Query: ?communityId=&category=&status=&page=&pageSize=
 */
router.get('/activities', async (req, res) => {
  try {
    const { communityId, category, status, page, pageSize } = req.query;
    const result = await squareService.getActivities({
      communityId: communityId ? Number(communityId) : undefined,
      category,
      status,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('获取活动列表失败:', e.message);
    res.status(500).json({ code: 500, message: '服务异常', data: null });
  }
});

/**
 * GET /api/square/activities/:id
 * 获取活动详情
 */
router.get('/activities/:id', async (req, res) => {
  try {
    const activity = await squareService.getActivityById(Number(req.params.id));
    if (!activity) return res.status(404).json({ code: 404, message: '活动不存在', data: null });
    res.json({ code: 0, message: '获取成功', data: activity });
  } catch (e) {
    console.error('获取活动详情失败:', e.message);
    res.status(500).json({ code: 500, message: '服务异常', data: null });
  }
});

/**
 * POST /api/square/activities
 * 创建社区活动
 * Body: { title, category, description, location, startTime, endTime, maxParticipants?, coverUrl?, organizerId, communityId, tags? }
 */
router.post('/activities', async (req, res) => {
  try {
    const { title, category, description, location, startTime, endTime, maxParticipants, coverUrl, organizerId, communityId, tags } = req.body;
    if (!title || !category || !description || !location || !startTime || !endTime || !organizerId || !communityId) {
      return res.status(400).json({ code: 400, message: '请填写完整信息', data: null });
    }
    const result = await squareService.createActivity(req.body);
    res.json({ code: 0, message: '创建成功', data: result });
  } catch (e) {
    console.error('创建活动失败:', e.message);
    res.status(500).json({ code: 500, message: '创建失败', data: null });
  }
});

/**
 * POST /api/square/activities/:id/register
 * 活动报名
 * Body: { userId, name, phone, elderId?, remark? }
 */
router.post('/activities/:id/register', async (req, res) => {
  try {
    const { userId, name, phone, elderId, remark } = req.body;
    if (!userId || !name || !phone) {
      return res.status(400).json({ code: 400, message: '请填写报名信息', data: null });
    }
    const result = await squareService.registerActivity(Number(req.params.id), userId, { name, phone, elderId, remark });
    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.message, data: null });
    }
    res.json({ code: 0, message: result.message, data: result });
  } catch (e) {
    console.error('报名失败:', e.message);
    res.status(500).json({ code: 500, message: '报名失败', data: null });
  }
});

/**
 * POST /api/square/activities/:id/cancel
 * 取消报名
 * Body: { userId }
 */
router.post('/activities/:id/cancel', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ code: 400, message: '缺少用户信息', data: null });
    const result = await squareService.cancelRegistration(Number(req.params.id), userId);
    if (!result.success) {
      return res.status(400).json({ code: 400, message: result.message, data: null });
    }
    res.json({ code: 0, message: result.message, data: result });
  } catch (e) {
    console.error('取消报名失败:', e.message);
    res.status(500).json({ code: 500, message: '操作失败', data: null });
  }
});

/**
 * GET /api/square/activity-templates
 * 获取活动模板
 */
router.get('/activity-templates', (req, res) => {
  const result = squareService.getActivityTemplates();
  res.json({ code: 0, message: '获取成功', data: result });
});

// ==================== 音乐创作知识库 ====================

/**
 * GET /api/square/music-knowledge
 * 获取音乐创作知识库
 * Query: ?category=&difficulty=
 */
router.get('/music-knowledge', (req, res) => {
  const { category, difficulty } = req.query;
  const result = squareService.getMusicKnowledge({ category, difficulty });
  res.json({ code: 0, message: '获取成功', data: result });
});

/**
 * GET /api/square/music-knowledge/:id
 * 获取单条音乐知识
 */
router.get('/music-knowledge/:id', (req, res) => {
  const item = squareService.getMusicKnowledgeById(Number(req.params.id));
  if (!item) return res.status(404).json({ code: 404, message: '知识不存在', data: null });
  res.json({ code: 0, message: '获取成功', data: item });
});

/**
 * GET /api/square/music-knowledge-categories
 * 获取音乐知识分类
 */
router.get('/music-knowledge-categories', (req, res) => {
  const result = squareService.getMusicCategories();
  res.json({ code: 0, message: '获取成功', data: { categories: result } });
});

// ==================== 用户创作广场 ====================

/**
 * GET /api/square/creations
 * 获取用户创作列表（按点赞数排序）
 * Query: ?userId=&type=&page=&pageSize=
 */
router.get('/creations', async (req, res) => {
  try {
    const { userId, type, page, pageSize } = req.query;
    const result = await squareService.getUserCreations({
      userId: userId ? Number(userId) : undefined,
      type,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 10,
    });
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('获取创作列表失败:', e.message);
    res.status(500).json({ code: 500, message: '服务异常', data: null });
  }
});

/**
 * POST /api/square/creations
 * 发布创作
 * Body: { userId, type, title, content, description? }
 */
router.post('/creations', async (req, res) => {
  try {
    const { userId, type, title, content, description } = req.body;
    if (!userId || !type || !title || !content) {
      return res.status(400).json({ code: 400, message: '请填写完整信息', data: null });
    }
    const result = await squareService.createUserCreation(req.body);
    res.json({ code: 0, message: '发布成功', data: result });
  } catch (e) {
    console.error('发布创作失败:', e.message);
    res.status(500).json({ code: 500, message: '发布失败', data: null });
  }
});

/**
 * POST /api/square/creations/:id/like
 * 点赞创作
 */
router.post('/creations/:id/like', async (req, res) => {
  try {
    const result = await squareService.likeCreation(Number(req.params.id));
    res.json({ code: 0, message: result.message, data: result });
  } catch (e) {
    console.error('点赞失败:', e.message);
    res.status(500).json({ code: 500, message: '操作失败', data: null });
  }
});

// ==================== 评论 ====================

/**
 * GET /api/square/comments?targetType=CREATION&targetId=1&page=1&pageSize=20
 * 获取评论列表
 */
router.get('/comments', async (req, res) => {
  try {
    const { targetType, targetId, page, pageSize } = req.query;
    if (!targetType || !targetId) {
      return res.status(400).json({ code: 400, message: '请提供目标类型和ID', data: null });
    }
    const result = await squareService.getComments(targetType, Number(targetId), Number(page) || 1, Number(pageSize) || 20);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('获取评论失败:', e.message);
    res.status(500).json({ code: 500, message: '服务异常', data: null });
  }
});

/**
 * POST /api/square/comments
 * 发表评论
 * Body: { targetType, targetId, userId, userName?, content, parentId? }
 */
router.post('/comments', async (req, res) => {
  try {
    const { targetType, targetId, userId, userName, content, parentId } = req.body;
    if (!targetType || !targetId || !userId || !content) {
      return res.status(400).json({ code: 400, message: '请填写完整信息', data: null });
    }
    if (content.length > 500) {
      return res.status(400).json({ code: 400, message: '评论内容不能超过500字', data: null });
    }
    const result = await squareService.addComment(req.body);
    res.json({ code: 0, message: '评论成功', data: result });
  } catch (e) {
    console.error('发表评论失败:', e.message);
    res.status(500).json({ code: 500, message: '评论失败', data: null });
  }
});

/**
 * DELETE /api/square/comments/:id
 * 删除评论
 */
router.delete('/comments/:id', async (req, res) => {
  try {
    const result = await squareService.deleteComment(Number(req.params.id));
    res.json({ code: 0, message: result.message, data: result });
  } catch (e) {
    console.error('删除评论失败:', e.message);
    res.status(500).json({ code: 500, message: '操作失败', data: null });
  }
});

// ==================== 通用点赞 ====================

/**
 * POST /api/square/like/toggle
 * 点赞/取消点赞
 * Body: { targetType, targetId, userId }
 */
router.post('/like/toggle', async (req, res) => {
  try {
    const { targetType, targetId, userId } = req.body;
    if (!targetType || !targetId || !userId) {
      return res.status(400).json({ code: 400, message: '请提供完整信息', data: null });
    }
    const result = await squareService.toggleLike(targetType, Number(targetId), userId);
    res.json({ code: 0, message: result.message, data: result });
  } catch (e) {
    console.error('点赞操作失败:', e.message);
    res.status(500).json({ code: 500, message: '操作失败', data: null });
  }
});

/**
 * GET /api/square/like/count?targetType=CREATION&targetId=1
 * 获取点赞数
 */
router.get('/like/count', async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    if (!targetType || !targetId) {
      return res.status(400).json({ code: 400, message: '请提供目标类型和ID', data: null });
    }
    const result = await squareService.getLikeCount(targetType, Number(targetId));
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('获取点赞数失败:', e.message);
    res.status(500).json({ code: 500, message: '服务异常', data: null });
  }
});

/**
 * GET /api/square/like/status?targetType=CREATION&targetId=1&userId=1
 * 查询用户是否已点赞
 */
router.get('/like/status', async (req, res) => {
  try {
    const { targetType, targetId, userId } = req.query;
    if (!targetType || !targetId || !userId) {
      return res.status(400).json({ code: 400, message: '请提供完整参数', data: null });
    }
    const result = await squareService.getUserLikeStatus(targetType, Number(targetId), userId);
    res.json({ code: 0, message: '获取成功', data: result });
  } catch (e) {
    console.error('查询点赞状态失败:', e.message);
    res.status(500).json({ code: 500, message: '服务异常', data: null });
  }
});

module.exports = router;