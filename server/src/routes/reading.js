// ============================================================
// 乐龄守护 · 国学经典阅读路由
// ============================================================
const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { ok, fail } = require('../middleware/response');
const readingService = require('../services/readingService');

const router = express.Router();

// GET /api/reading/books - 获取所有书籍
router.get('/books', requireAuth, async (req, res) => {
  try {
    const books = await readingService.getBooks();
    return ok(res, books);
  } catch (err) {
    console.error('获取书籍列表失败:', err);
    return fail(res, 500, '获取失败');
  }
});

// GET /api/reading/books/:id - 获取书籍详情
router.get('/books/:id', requireAuth, async (req, res) => {
  try {
    const book = await readingService.getBookDetail(Number(req.params.id));
    if (!book) {
      return fail(res, 404, '书籍不存在');
    }
    return ok(res, book);
  } catch (err) {
    console.error('获取书籍详情失败:', err);
    return fail(res, 500, '获取失败');
  }
});

// GET /api/reading/books/:bookId/chapters - 获取书籍章节列表
router.get('/books/:bookId/chapters', requireAuth, async (req, res) => {
  try {
    const chapters = await readingService.getChapters(Number(req.params.bookId));
    return ok(res, chapters);
  } catch (err) {
    console.error('获取章节列表失败:', err);
    return fail(res, 500, '获取失败');
  }
});

// GET /api/reading/chapters/:id - 获取章节详情
router.get('/chapters/:id', requireAuth, async (req, res) => {
  try {
    const chapter = await readingService.getChapterDetail(Number(req.params.id));
    if (!chapter) {
      return fail(res, 404, '章节不存在');
    }
    return ok(res, chapter);
  } catch (err) {
    console.error('获取章节详情失败:', err);
    return fail(res, 500, '获取失败');
  }
});

// GET /api/reading/progress - 获取阅读进度
router.get('/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bookId } = req.query;
    if (!bookId) {
      return fail(res, 400, '缺少书籍ID');
    }
    const progress = await readingService.getReadingProgress(userId, Number(bookId));
    return ok(res, progress);
  } catch (err) {
    console.error('获取阅读进度失败:', err);
    return fail(res, 500, '获取失败');
  }
});

// POST /api/reading/progress - 保存阅读进度
router.post('/progress', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bookId, chapterId, scrollPosition } = req.body;
    if (!bookId || !chapterId) {
      return fail(res, 400, '缺少书籍ID或章节ID');
    }
    const progress = await readingService.saveReadingProgress(
      userId,
      Number(bookId),
      Number(chapterId),
      scrollPosition || 0
    );
    return ok(res, progress, '保存成功');
  } catch (err) {
    console.error('保存阅读进度失败:', err);
    return fail(res, 500, '保存失败');
  }
});

// GET /api/reading/bookmarks - 获取书签列表
router.get('/bookmarks', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bookId } = req.query;
    if (!bookId) {
      return fail(res, 400, '缺少书籍ID');
    }
    const bookmarks = await readingService.getUserBookmarks(userId, Number(bookId));
    return ok(res, bookmarks);
  } catch (err) {
    console.error('获取书签列表失败:', err);
    return fail(res, 500, '获取失败');
  }
});

// POST /api/reading/bookmarks - 添加书签
router.post('/bookmarks', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { bookId, chapterId, note } = req.body;
    if (!bookId || !chapterId) {
      return fail(res, 400, '缺少书籍ID或章节ID');
    }
    const result = await readingService.addBookmark(
      userId,
      Number(bookId),
      Number(chapterId),
      note
    );
    return ok(res, result, '添加成功');
  } catch (err) {
    console.error('添加书签失败:', err);
    return fail(res, 500, '添加失败');
  }
});

// DELETE /api/reading/bookmarks/:id - 删除书签
router.delete('/bookmarks/:id', requireAuth, async (req, res) => {
  try {
    const deleted = await readingService.deleteBookmark(Number(req.params.id));
    if (!deleted) {
      return fail(res, 404, '书签不存在');
    }
    return ok(res, null, '删除成功');
  } catch (err) {
    console.error('删除书签失败:', err);
    return fail(res, 500, '删除失败');
  }
});

module.exports = router;