/**
 * ============================================================
 * 乐龄守护 · 音乐创作 API
 * 结合 AI 社区独居老人智能巡检系统
 * ============================================================
 */

import axios from '../utils/request';

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
  return axios.get<{ code: number; data: Theme[] }>('/api/music/themes');
};

/**
 * 获取所有音乐风格
 */
export const getStyles = () => {
  return axios.get<{ code: number; data: MusicStyle[] }>('/api/music/styles');
};

/**
 * 生成歌词
 */
export const generateLyrics = (params: GenerateParams) => {
  return axios.post<{ code: number; data: Lyrics }>('/api/music/lyrics', params);
};

/**
 * 生成音乐
 */
export const generateMusic = (params: { lyrics: string; theme: string; style?: string; title?: string }) => {
  return axios.post<{ code: number; data: any }>('/api/music/generate', params);
};

/**
 * 查询音乐生成状态
 */
export const getMusicStatus = (id: string) => {
  return axios.get<{ code: number; data: any }>(`/api/music/status/${id}`);
};

/**
 * 获取我的作品列表
 */
export const getMyWorks = () => {
  return axios.get<{ code: number; data: MusicWork[] }>('/api/music/my-works');
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
  return axios.post<{ code: number; data: any }>('/api/music/save', params);
};

/**
 * 删除作品
 */
export const deleteWork = (id: string) => {
  return axios.delete<{ code: number; message: string }>(`/api/music/${id}`);
};
