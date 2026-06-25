import { request } from './request';

export interface ClassicalBook {
  id: number;
  title: string;
  author: string;
  dynasty: string;
  category: string;
  coverDesc: string;
  summary: string;
  totalChapters: number;
  tags: string[];
  sortOrder: number;
}

export interface ClassicalChapter {
  id: number;
  bookId: number;
  chapterOrder: number;
  title: string;
  content: string;
  translation: string;
  annotation: string;
  audioUrl: string;
}

export interface ReadingProgress {
  id: number;
  userId: number;
  bookId: number;
  chapterId: number;
  scrollPosition: number;
  isFinished: number;
}

export interface Bookmark {
  id: number;
  userId: number;
  bookId: number;
  chapterId: number;
  note: string;
  gmtCreate: string;
}

export async function getBooks() {
  return request.get('/reading/books');
}

export async function getBookDetail(id: number) {
  return request.get(`/reading/books/${id}`);
}

export async function getChapters(bookId: number) {
  return request.get(`/reading/books/${bookId}/chapters`);
}

export async function getChapterDetail(id: number) {
  return request.get(`/reading/chapters/${id}`);
}

export async function getReadingProgress(bookId: number) {
  return request.get('/reading/progress', { params: { bookId } });
}

export async function saveReadingProgress(bookId: number, chapterId: number, scrollPosition?: number) {
  return request.post('/reading/progress', { bookId, chapterId, scrollPosition });
}

export async function getBookmarks(bookId: number) {
  return request.get('/reading/bookmarks', { params: { bookId } });
}

export async function addBookmark(bookId: number, chapterId: number, note?: string) {
  return request.post('/reading/bookmarks', { bookId, chapterId, note });
}

export async function deleteBookmark(id: number) {
  return request.delete(`/reading/bookmarks/${id}`);
}