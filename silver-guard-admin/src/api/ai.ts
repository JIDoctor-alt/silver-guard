// ============================================================
// Silver Guard · RAG & 音乐 API
// ============================================================
import { request } from './request';

// ==================== RAG 类型 ====================

export interface RAGSource {
  id: number;
  title: string;
  category: string;
}

export interface RAGAnswer {
  answer: string;
  sources: RAGSource[];
  question: string;
}

export interface RAGKnowledgeItem {
  id: number;
  category: string;
  title: string;
  keywords: string[];
  content: string;
}

export interface RAGCategory {
  name: string;
  count: number;
}

// ==================== 音乐类型 ====================

export interface DanceSong {
  id: number;
  title: string;
  artist: string;
  tempo: string;
  bpm: number;
  duration: string;
  genre: string;
  tags: string[];
}

export interface MusicComposition {
  title: string;
  theme: string;
  tempo: string;
  bpm: number;
  style: string;
  mood: string;
  key: string;
  timeSignature: string;
  melody: { note: string; duration: string }[];
  description: string;
  caution: string;
}

export interface LyricsComposition {
  title: string;
  theme: string;
  genre: string;
  content: string;
  lineCount: number;
  description: string;
}

export interface MusicCategories {
  genres: string[];
  tempos: string[];
  tags: string[];
  lyricThemes: string[];
  totalSongs: number;
}

// ==================== RAG API ====================

// 同步问答
export const ragChat = (params: {
  question: string;
  elderName?: string;
  elderId?: number;
}) => request.post<RAGAnswer>('/rag/chat', params);

// 知识库检索
export const ragSearch = (q: string, topK?: number) =>
  request.get<{ docs: RAGKnowledgeItem[]; total: number }>('/rag/search', { params: { q, topK } });

// 获取知识库分类
export const ragCategories = () =>
  request.get<{ categories: RAGCategory[] }>('/rag/categories');

// 获取知识库所有条目
export const ragKnowledge = () =>
  request.get<{ items: RAGKnowledgeItem[]; total: number }>('/rag/knowledge');

// ==================== 音乐 API ====================

// 推荐广场舞曲
export const getDanceSongs = (params?: {
  tempo?: string;
  genre?: string;
  tag?: string;
  limit?: number;
}) => request.get<{ songs: DanceSong[]; total: number }>('/music/dance', { params });

// AI 作曲
export const composeMusic = (params: {
  theme?: string;
  tempo?: string;
  style?: string;
  mood?: string;
}) => request.post<MusicComposition>('/music/compose', params);

// AI 作词
export const composeLyrics = (params: {
  theme?: string;
  genre?: string;
}) => request.post<LyricsComposition>('/music/lyrics', params);

// 获取音乐分类
export const getMusicCategories = () =>
  request.get<MusicCategories>('/music/categories');

// ==================== SSE API ====================

// 获取 SSE 连接状态
export const getSSEStatus = () =>
  request.get<{ connections: number; uptime: number }>('/sse/status');