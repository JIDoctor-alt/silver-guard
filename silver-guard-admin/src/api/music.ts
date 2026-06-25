/**
 * ============================================================
 * 乐龄守护 · 音乐创作 API
 * 结合 AI 社区独居老人智能巡检系统
 * ============================================================
 */

import axios from './request';

export interface Theme {
  id: string;
  name: string;
  style: string;
  bpm: number;
  mood: string;
  tags: string[];
}

export interface MusicStyle {
  id: string;
  name: string;
  icon: string;
  description: string;
  bpmRange: string;
}

export interface Lyrics {
  id: string;
  title: string;
  description: string;
  theme: string;
  style: string;
  bpm: number;
  mood: string;
  tags: string[];
  lyrics: string;
  createdAt: string;
  suggestedStyle?: MusicStyle;
}

export interface MusicWork {
  id: string;
  title: string;
  theme: string;
  style: string;
  duration: number;
  coverUrl: string;
  audioUrl: string;
  createdAt: string;
}

export interface GenerateParams {
  theme: string;
  style?: string;
  customTheme?: {
    title?: string;
    description?: string;
  };
  customWords?: {
    community?: string;
    patrol?: string;
    elder?: string;
  };
}

/**
 * 获取所有可用主题
 */
export const getThemes = () => {
  return axios.get<{ code: number; data: Theme[] }>('/music/themes');
};

/**
 * 获取所有音乐风格
 */
export const getStyles = () => {
  return axios.get<{ code: number; data: MusicStyle[] }>('/music/styles');
};

/**
 * 生成歌词
 */
export const generateLyrics = (params: GenerateParams) => {
  return axios.post<{ code: number; data: Lyrics }>('/music/lyrics', params);
};

/**
 * 生成音乐
 */
export const generateMusic = (params: { lyrics: string; theme: string; style?: string; title?: string }) => {
  return axios.post<{ code: number; data: any }>('/music/generate', params);
};

/**
 * 查询音乐生成状态
 */
export const getMusicStatus = (id: string) => {
  return axios.get<{ code: number; data: any }>(`/music/status/${id}`);
};

/**
 * 获取我的作品列表
 */
export const getMyWorks = () => {
  return axios.get<{ code: number; data: MusicWork[] }>('/music/my-works');
};

/**
 * 保存作品
 */
export const saveWork = (params: {
  title: string;
  lyrics: string;
  theme: string;
  style: string;
  audioUrl?: string;
  coverUrl?: string;
}) => {
  return axios.post<{ code: number; data: any }>('/music/save', params);
};

/**
 * 删除作品
 */
export const deleteWork = (id: string) => {
  return axios.delete<{ code: number; message: string }>(`/music/${id}`);
};

/**
 * 流式生成歌词（SSE）
 * 直接返回 fetch Response，供上层使用 ReadableStream 读取
 */
export const generateLyricsStream = (params: { theme: string; style?: string }) => {
  const token = localStorage.getItem('token');
  return fetch('/api/music/lyrics/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ theme: params.theme, genre: params.style }),
  });
};
