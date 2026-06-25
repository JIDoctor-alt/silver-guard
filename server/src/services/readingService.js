// ============================================================
// 乐龄守护 · 国学经典阅读服务
// ============================================================
const pool = require('../db/mysql');

/**
 * 解析 JSON 字段（兼容字符串和数组/对象）
 */
function parseJsonField(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

// ==================== 书籍相关 ====================

/**
 * 获取所有书籍
 */
async function getBooks() {
  const [rows] = await pool.query(
    'SELECT * FROM classical_book WHERE deleted = 0 ORDER BY sort_order ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author,
    dynasty: r.dynasty,
    category: r.category,
    coverDesc: r.cover_desc,
    summary: r.summary,
    totalChapters: r.total_chapters,
    tags: parseJsonField(r.tags) || [],
    sortOrder: r.sort_order,
  }));
}

/**
 * 获取单本书籍详情
 */
async function getBookDetail(id) {
  const [rows] = await pool.query(
    'SELECT * FROM classical_book WHERE id = ? AND deleted = 0',
    [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    title: r.title,
    author: r.author,
    dynasty: r.dynasty,
    category: r.category,
    coverDesc: r.cover_desc,
    summary: r.summary,
    totalChapters: r.total_chapters,
    tags: parseJsonField(r.tags) || [],
    sortOrder: r.sort_order,
  };
}

// ==================== 章节相关 ====================

/**
 * 获取书籍所有章节
 */
async function getChapters(bookId) {
  const [rows] = await pool.query(
    'SELECT id, book_id, chapter_order, title FROM classical_chapter WHERE book_id = ? ORDER BY chapter_order ASC',
    [bookId]
  );
  return rows.map((r) => ({
    id: r.id,
    bookId: r.book_id,
    chapterOrder: r.chapter_order,
    title: r.title,
  }));
}

/**
 * 获取章节详情（含正文、译文、注释）
 */
async function getChapterDetail(id) {
  const [rows] = await pool.query(
    'SELECT * FROM classical_chapter WHERE id = ?',
    [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    bookId: r.book_id,
    chapterOrder: r.chapter_order,
    title: r.title,
    content: r.content,
    translation: r.translation,
    annotation: r.annotation,
    audioUrl: r.audio_url,
  };
}

// ==================== 阅读进度 ====================

/**
 * 获取用户在某本书的阅读进度
 */
async function getReadingProgress(userId, bookId) {
  const [rows] = await pool.query(
    'SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?',
    [userId, bookId]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    userId: r.user_id,
    bookId: r.book_id,
    chapterId: r.chapter_id,
    scrollPosition: r.scroll_position,
    isFinished: r.is_finished,
  };
}

/**
 * 保存阅读进度（存在则更新，不存在则新增）
 */
async function saveReadingProgress(userId, bookId, chapterId, scrollPosition) {
  const [existing] = await pool.query(
    'SELECT id FROM reading_progress WHERE user_id = ? AND book_id = ?',
    [userId, bookId]
  );
  if (existing.length > 0) {
    await pool.query(
      'UPDATE reading_progress SET chapter_id = ?, scroll_position = ? WHERE id = ?',
      [chapterId, scrollPosition, existing[0].id]
    );
  } else {
    await pool.query(
      'INSERT INTO reading_progress (user_id, book_id, chapter_id, scroll_position, is_finished) VALUES (?, ?, ?, ?, 0)',
      [userId, bookId, chapterId, scrollPosition]
    );
  }
  return getReadingProgress(userId, bookId);
}

// ==================== 书签 ====================

/**
 * 获取用户在某本书的书签列表
 */
async function getUserBookmarks(userId, bookId) {
  const [rows] = await pool.query(
    'SELECT * FROM bookmark WHERE user_id = ? AND book_id = ? AND deleted = 0 ORDER BY id DESC',
    [userId, bookId]
  );
  return rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    bookId: r.book_id,
    chapterId: r.chapter_id,
    note: r.note,
  }));
}

/**
 * 添加书签
 */
async function addBookmark(userId, bookId, chapterId, note) {
  const [result] = await pool.query(
    'INSERT INTO bookmark (user_id, book_id, chapter_id, note) VALUES (?, ?, ?, ?)',
    [userId, bookId, chapterId, note || null]
  );
  return { id: result.insertId };
}

/**
 * 软删除书签
 */
async function deleteBookmark(id) {
  const [result] = await pool.query(
    'UPDATE bookmark SET deleted = 1 WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getBooks,
  getBookDetail,
  getChapters,
  getChapterDetail,
  getReadingProgress,
  saveReadingProgress,
  getUserBookmarks,
  addBookmark,
  deleteBookmark,
};