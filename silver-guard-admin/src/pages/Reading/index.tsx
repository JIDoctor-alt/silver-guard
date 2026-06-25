import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  List,
  Tag,
  Typography,
  Spin,
  Empty,
  Button,
  Collapse,
  Space,
  Divider,
  Breadcrumb,
  message,
  Tooltip,
  Progress,
  Drawer,
} from 'antd';
import {
  BookOutlined,
  ReadOutlined,
  LeftOutlined,
  RightOutlined,
  FontSizeOutlined,
  StarOutlined,
  StarFilled,
  CheckOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  getBooks,
  getChapters,
  getChapterDetail,
  getReadingProgress,
  saveReadingProgress,
  getBookmarks,
  addBookmark,
  deleteBookmark,
  type ClassicalBook,
  type ClassicalChapter,
  type ReadingProgress,
  type Bookmark,
} from '../../api/reading';

const { Title, Paragraph, Text } = Typography;

const CATEGORIES = [
  { value: 'ALL', label: '全部' },
  { value: 'CLASSIC', label: '经典' },
  { value: 'POETRY', label: '诗词' },
  { value: 'PHILOSOPHY', label: '哲学' },
  { value: 'HEALTH', label: '养生' },
];

const FONT_SIZE_OPTIONS = [
  { key: 'small', label: '小', size: 16 },
  { key: 'medium', label: '中', size: 20 },
  { key: 'large', label: '大', size: 24 },
] as const;

const categoryColors: Record<string, string> = {
  CLASSIC: '#722ed1',
  POETRY: '#eb2f96',
  PHILOSOPHY: '#13c2c2',
  HEALTH: '#52c41a',
};

export default function ReadingPage() {
  // ---- book list state ----
  const [books, setBooks] = useState<ClassicalBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [bookProgressMap, setBookProgressMap] = useState<Record<number, ReadingProgress>>({});

  // ---- reading state ----
  const [selectedBook, setSelectedBook] = useState<ClassicalBook | null>(null);
  const [chapters, setChapters] = useState<ClassicalChapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<ClassicalChapter | null>(null);
  const [chapterContent, setChapterContent] = useState<ClassicalChapter | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);

  // ---- bookmark state ----
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [bookmarkDrawerOpen, setBookmarkDrawerOpen] = useState(false);

  // ---- ui state ----
  const [fontSize, setFontSize] = useState(20);

  // ======================== Load books ========================
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBooks();
      if (res.code === 200) {
        const bookList = (res.data as ClassicalBook[]) || [];
        setBooks(bookList);
        // fetch progress for all books in parallel
        const progressResults = await Promise.allSettled(
          bookList.map((b) => getReadingProgress(b.id)),
        );
        const progressMap: Record<number, ReadingProgress> = {};
        progressResults.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value.code === 200) {
            progressMap[bookList[idx].id] = result.value.data as ReadingProgress;
          }
        });
        setBookProgressMap(progressMap);
      }
    } catch {
      message.error('加载书籍列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // ======================== Enter reading ========================
  const enterReading = useCallback(
    async (book: ClassicalBook, targetChapterId?: number) => {
      setSelectedBook(book);
      setSelectedChapter(null);
      setChapterContent(null);

      try {
        const [chaptersRes, progressRes, bookmarksRes] = await Promise.all([
          getChapters(book.id),
          getReadingProgress(book.id),
          getBookmarks(book.id),
        ]);

        if (chaptersRes.code === 200) {
          const chapterList = (chaptersRes.data as ClassicalChapter[]) || [];
          setChapters(chapterList);

          if (progressRes.code === 200) {
            setReadingProgress(progressRes.data as ReadingProgress);
          }

          if (bookmarksRes.code === 200) {
            setBookmarks((bookmarksRes.data as Bookmark[]) || []);
          }

          // determine which chapter to open
          let chapterToOpen: ClassicalChapter | undefined;
          if (targetChapterId) {
            chapterToOpen = chapterList.find((c) => c.id === targetChapterId);
          }
          if (!chapterToOpen && progressRes.code === 200) {
            const progress = progressRes.data as ReadingProgress;
            chapterToOpen = chapterList.find((c) => c.id === progress?.chapterId);
          }
          chapterToOpen = chapterToOpen || chapterList[0];

          if (chapterToOpen) {
            setSelectedChapter(chapterToOpen);
            await loadChapterContent(chapterToOpen.id);
          }
        }
      } catch {
        message.error('加载章节失败');
      }
    },
    [],
  );

  // ======================== Load chapter content ========================
  const loadChapterContent = useCallback(async (chapterId: number) => {
    setChapterLoading(true);
    try {
      const res = await getChapterDetail(chapterId);
      if (res.code === 200) {
        setChapterContent(res.data as ClassicalChapter);
      }
    } catch {
      message.error('加载章节内容失败');
    } finally {
      setChapterLoading(false);
    }
  }, []);

  // ======================== Switch chapter ========================
  const switchChapter = useCallback(
    async (chapter: ClassicalChapter) => {
      if (!selectedBook) return;
      setSelectedChapter(chapter);
      setChapterContent(null);

      // auto-save progress
      try {
        const res = await saveReadingProgress(selectedBook.id, chapter.id);
        if (res.code === 200) {
          setReadingProgress(res.data as ReadingProgress);
          // refresh progress map for book list
          setBookProgressMap((prev) => ({
            ...prev,
            [selectedBook.id]: res.data as ReadingProgress,
          }));
        }
      } catch {
        // silent fail on progress save
      }

      await loadChapterContent(chapter.id);
    },
    [selectedBook, loadChapterContent],
  );

  // ======================== Navigate prev/next ========================
  const goToPrevChapter = useCallback(() => {
    if (!selectedChapter || chapters.length === 0) return;
    const idx = chapters.findIndex((c) => c.id === selectedChapter.id);
    if (idx > 0) {
      switchChapter(chapters[idx - 1]);
    }
  }, [selectedChapter, chapters, switchChapter]);

  const goToNextChapter = useCallback(() => {
    if (!selectedChapter || chapters.length === 0) return;
    const idx = chapters.findIndex((c) => c.id === selectedChapter.id);
    if (idx < chapters.length - 1) {
      switchChapter(chapters[idx + 1]);
    }
  }, [selectedChapter, chapters, switchChapter]);

  // ======================== Bookmark ========================
  const isBookmarked = useCallback(
    (chapterId: number) => bookmarks.some((b) => b.chapterId === chapterId),
    [bookmarks],
  );

  const handleToggleBookmark = useCallback(async () => {
    if (!selectedBook || !selectedChapter) return;
    const existing = bookmarks.find((b) => b.chapterId === selectedChapter.id);
    try {
      if (existing) {
        const res = await deleteBookmark(existing.id);
        if (res.code === 200) {
          setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
          message.success('已取消书签');
        }
      } else {
        await addBookmark(selectedBook.id, selectedChapter.id);
        // refetch bookmarks to get the full list with proper data
        const bookmarksRes = await getBookmarks(selectedBook.id);
        if (bookmarksRes.code === 200) {
          setBookmarks((bookmarksRes.data as Bookmark[]) || []);
        }
        message.success('已添加书签');
      }
    } catch {
      message.error('操作失败');
    }
  }, [selectedBook, selectedChapter, bookmarks]);

  // ======================== Back to book list ========================
  const backToBookList = useCallback(() => {
    setSelectedBook(null);
    setChapters([]);
    setSelectedChapter(null);
    setChapterContent(null);
    setReadingProgress(null);
    setBookmarks([]);
  }, []);

  // ======================== Filtered books ========================
  const filteredBooks =
    categoryFilter === 'ALL'
      ? books
      : books.filter((b) => b.category === categoryFilter);

  // ======================== Progress percentage ========================
  const chapterProgress =
    selectedBook && readingProgress && selectedChapter
      ? Math.round(
          ((chapters.findIndex((c) => c.id === readingProgress.chapterId) + 1) /
            (chapters.length || 1)) *
            100,
        )
      : 0;

  // ======================== Render: Book list ========================
  if (!selectedBook) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            <ReadOutlined style={{ marginRight: 12 }} />
            经典阅读
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            品读国学经典，传承文化智慧
          </Text>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Space wrap>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                type={categoryFilter === cat.value ? 'primary' : 'default'}
                onClick={() => setCategoryFilter(cat.value)}
                size="large"
              >
                {cat.label}
              </Button>
            ))}
          </Space>
        </div>

        <Spin spinning={loading}>
          {filteredBooks.length === 0 ? (
            <Empty description="暂无书籍" style={{ padding: 60 }} />
          ) : (
            <Row gutter={[24, 24]}>
              {filteredBooks.map((book) => {
                const progress = bookProgressMap[book.id];
                const progressPercent = progress
                  ? Math.round(((progress.chapterId > 0 ? 1 : 0) / (book.totalChapters || 1)) * 100)
                  : 0;
                return (
                  <Col key={book.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      onClick={() => enterReading(book)}
                      style={{ height: '100%', borderRadius: 12 }}
                      bodyStyle={{ padding: 20 }}
                    >
                      {/* Cover description */}
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 8,
                          padding: '20px 16px',
                          marginBottom: 16,
                          minHeight: 80,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: '#fff',
                            fontSize: 20,
                            fontWeight: 600,
                            textAlign: 'center',
                            lineHeight: 1.4,
                          }}
                        >
                          {book.coverDesc}
                        </Text>
                      </div>

                      {/* Title & author */}
                      <Title level={4} style={{ marginBottom: 4 }}>
                        {book.title}
                      </Title>
                      <Text type="secondary">
                        {book.author} · {book.dynasty}
                      </Text>

                      {/* Tags */}
                      <div style={{ marginTop: 8, marginBottom: 8 }}>
                        <Tag color={categoryColors[book.category] || 'default'}>
                          {CATEGORIES.find((c) => c.value === book.category)?.label || book.category}
                        </Tag>
                        {book.tags?.slice(0, 2).map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>

                      {/* Summary excerpt */}
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        style={{ color: '#666', fontSize: 14, marginBottom: 16 }}
                      >
                        {book.summary}
                      </Paragraph>

                      {/* Progress / Continue reading */}
                      {progress ? (
                        <div style={{ marginTop: 12 }}>
                          <Progress
                            percent={progressPercent}
                            size="small"
                            strokeColor="#52c41a"
                            format={() => `${progressPercent}%`}
                          />
                          <Button
                            type="link"
                            icon={<HistoryOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              enterReading(book, progress.chapterId);
                            }}
                            style={{ padding: 0, marginTop: 4, fontSize: 14 }}
                          >
                            继续阅读
                          </Button>
                        </div>
                      ) : (
                        <div style={{ marginTop: 12 }}>
                          <Text type="secondary" style={{ fontSize: 13 }}>
                            <BookOutlined style={{ marginRight: 4 }} />
                            {book.totalChapters}章
                          </Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Spin>
      </div>
    );
  }

  // ======================== Render: Reading view ========================
  return (
    <div style={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Space>
          <Button icon={<LeftOutlined />} onClick={backToBookList} type="text" size="large">
            返回书库
          </Button>
          <Divider type="vertical" />
          <Breadcrumb
            items={[
              { title: <a onClick={backToBookList}>经典阅读</a> },
              { title: selectedBook.title },
            ]}
          />
        </Space>

        <Space>
          {/* Font size toggle */}
          <Space.Compact>
            {FONT_SIZE_OPTIONS.map((opt) => (
              <Button
                key={opt.key}
                type={fontSize === opt.size ? 'primary' : 'default'}
                onClick={() => setFontSize(opt.size)}
              >
                <FontSizeOutlined />
                {opt.label}
              </Button>
            ))}
          </Space.Compact>

          {/* Bookmark button */}
          <Tooltip title={isBookmarked(selectedChapter?.id ?? 0) ? '取消书签' : '添加书签'}>
            <Button
              icon={
                isBookmarked(selectedChapter?.id ?? 0) ? (
                  <StarFilled style={{ color: '#faad14' }} />
                ) : (
                  <StarOutlined />
                )
              }
              onClick={handleToggleBookmark}
            >
              {isBookmarked(selectedChapter?.id ?? 0) ? '已收藏' : '收藏'}
            </Button>
          </Tooltip>

          {/* Bookmark list */}
          <Button
            icon={<BookOutlined />}
            onClick={() => setBookmarkDrawerOpen(true)}
          >
            书签 {bookmarks.length > 0 && `(${bookmarks.length})`}
          </Button>
        </Space>
      </div>

      {/* Main reading area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left sidebar: Chapter list */}
        <div
          style={{
            width: 280,
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
            flexShrink: 0,
            padding: '8px 0',
          }}
        >
          {/* Reading progress */}
          {readingProgress && (
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <Progress
                percent={chapterProgress}
                size="small"
                strokeColor="#52c41a"
                format={() => `进度 ${chapterProgress}%`}
              />
            </div>
          )}

          <List
            dataSource={chapters}
            renderItem={(chapter) => {
              const active = selectedChapter?.id === chapter.id;
              const hasProgress =
                readingProgress &&
                chapters.findIndex((c) => c.id === readingProgress.chapterId) >=
                  chapters.findIndex((c) => c.id === chapter.id);
              return (
                <div
                  onClick={() => switchChapter(chapter)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: active ? '#e6f7ff' : 'transparent',
                    borderLeft: active ? '3px solid #1890ff' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = '#fafafa';
                  }}
                  onMouseLeave={(e) => {
                    if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {hasProgress && !active && (
                    <CheckOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                  )}
                  {active && <ReadOutlined style={{ color: '#1890ff', fontSize: 14 }} />}
                  <Text
                    style={{
                      flex: 1,
                      fontWeight: active ? 600 : 400,
                      color: active ? '#1890ff' : '#333',
                      fontSize: 15,
                    }}
                    ellipsis={{ tooltip: chapter.title }}
                  >
                    第{chapter.chapterOrder}章 {chapter.title}
                  </Text>
                  {isBookmarked(chapter.id) && (
                    <StarFilled style={{ color: '#faad14', fontSize: 14 }} />
                  )}
                </div>
              );
            }}
          />
        </div>

        {/* Right: Chapter content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 32 }}>
          <Spin spinning={chapterLoading}>
            {!chapterContent ? (
              <Empty description="请选择章节" style={{ padding: 80 }} />
            ) : (
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                {/* Chapter title */}
                <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
                  第{chapterContent.chapterOrder}章 {chapterContent.title}
                </Title>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <Text type="secondary">
                    {selectedBook.author} · {selectedBook.dynasty}
                  </Text>
                </div>

                <Divider />

                {/* Original text */}
                <div
                  style={{
                    fontSize,
                    lineHeight: 2,
                    color: '#1a1a1a',
                    whiteSpace: 'pre-wrap',
                    letterSpacing: 1,
                    marginBottom: 32,
                  }}
                >
                  {chapterContent.content}
                </div>

                {/* Translation & Annotation */}
                <Collapse
                  style={{ marginTop: 16 }}
                  items={[
                    {
                      key: 'translation',
                      label: (
                        <Space>
                          <ReadOutlined />
                          <span style={{ fontSize: 16 }}>译文</span>
                        </Space>
                      ),
                      children: (
                        <div
                          style={{
                            fontSize: 16,
                            lineHeight: 1.8,
                            color: '#555',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {chapterContent.translation || '暂无译文'}
                        </div>
                      ),
                    },
                    {
                      key: 'annotation',
                      label: (
                        <Space>
                          <StarOutlined />
                          <span style={{ fontSize: 16 }}>赏析</span>
                        </Space>
                      ),
                      children: (
                        <div
                          style={{
                            fontSize: 16,
                            lineHeight: 1.8,
                            color: '#555',
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {chapterContent.annotation || '暂无赏析'}
                        </div>
                      ),
                    },
                  ]}
                />

                {/* Prev/Next navigation */}
                <Divider />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={goToPrevChapter}
                    disabled={
                      !selectedChapter ||
                      chapters.findIndex((c) => c.id === selectedChapter.id) === 0
                    }
                    size="large"
                  >
                    上一章
                  </Button>
                  <Button
                    icon={<RightOutlined />}
                    onClick={goToNextChapter}
                    disabled={
                      !selectedChapter ||
                      chapters.findIndex((c) => c.id === selectedChapter.id) === chapters.length - 1
                    }
                    size="large"
                  >
                    下一章
                  </Button>
                </div>
              </div>
            )}
          </Spin>
        </div>
      </div>

      {/* Bookmark drawer */}
      <Drawer
        title={
          <Space>
            <StarOutlined />
            我的书签
          </Space>
        }
        placement="right"
        onClose={() => setBookmarkDrawerOpen(false)}
        open={bookmarkDrawerOpen}
        width={360}
      >
        {bookmarks.length === 0 ? (
          <Empty description="暂无书签" />
        ) : (
          <List
            dataSource={bookmarks}
            renderItem={(bookmark) => {
              const chapter = chapters.find((c) => c.id === bookmark.chapterId);
              return (
                <List.Item
                  actions={[
                    <Button
                      key="delete"
                      type="link"
                      danger
                      onClick={async () => {
                        try {
                          const res = await deleteBookmark(bookmark.id);
                          if (res.code === 200) {
                            setBookmarks((prev) => prev.filter((b) => b.id !== bookmark.id));
                            message.success('已删除');
                          }
                        } catch {
                          message.error('删除失败');
                        }
                      }}
                    >
                      删除
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <a
                        onClick={() => {
                          setBookmarkDrawerOpen(false);
                          if (chapter) switchChapter(chapter);
                        }}
                      >
                        {chapter ? `第${chapter.chapterOrder}章 ${chapter.title}` : `第${bookmark.chapterId}章`}
                      </a>
                    }
                    description={bookmark.note || '无备注'}
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Drawer>
    </div>
  );
}