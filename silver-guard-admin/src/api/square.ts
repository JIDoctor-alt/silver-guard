// ============================================================
// Silver Guard · 银龄广场 API
// ============================================================
import { request } from './request';

// ==================== 类型定义 ====================

export interface DanceStep {
  id: number;
  name: string;
  difficulty: string;
  category: string;
  description: string;
  steps: string[];
  tips: string;
}

export interface DanceSong {
  id: number;
  title: string;
  artist: string;
  tempo: string;
  bpm: number;
  genre: string;
  tags: string[];
}

export interface Activity {
  id: number;
  title: string;
  category: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number | null;
  current_participants: number;
  cover_url: string | null;
  organizer_id: number;
  community_id: number;
  status: string;
  tags: string[];
  gmt_create: string;
}

export interface ActivityTemplate {
  title: string;
  category: string;
  description: string;
  tags: string[];
}

export interface MusicKnowledgeItem {
  id: number;
  category: string;
  subCategory: string;
  title: string;
  difficulty: string;
  description: string;
  content: Record<string, unknown>;
}

export interface MusicKnowledgeCategory {
  name: string;
  label: string;
  count: number;
}

export interface UserCreation {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: Record<string, unknown>;
  description: string | null;
  likes: number;
  comments_count: number;
  status: string;
  gmt_create: string;
}

// ==================== 广场舞步法 API ====================

export const getDanceSteps = (category?: string) =>
  request.get<{ steps: DanceStep[]; total: number }>('/square/dance-steps', { params: { category } });

export const getDanceStepById = (id: number) =>
  request.get<DanceStep>(`/square/dance-steps/${id}`);

export const getDanceSongs = () =>
  request.get<{ songs: DanceSong[]; total: number }>('/square/dance-songs');

// ==================== 社区活动 API ====================

export const getActivities = (params?: {
  communityId?: number;
  category?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) => request.get<{ activities: Activity[]; total: number; page: number; pageSize: number }>('/square/activities', { params });

export const getActivityById = (id: number) =>
  request.get<Activity>(`/square/activities/${id}`);

export const createActivity = (data: {
  title: string;
  category: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
  coverUrl?: string;
  organizerId: number;
  communityId: number;
  tags?: string[];
}) => request.post<{ id: number }>('/square/activities', data);

export const registerActivity = (activityId: number, data: {
  userId: number;
  name: string;
  phone: string;
  elderId?: number;
  remark?: string;
}) => request.post<{ success: boolean; message: string; id?: number }>(`/square/activities/${activityId}/register`, data);

export const cancelRegistration = (activityId: number, userId: number) =>
  request.post<{ success: boolean; message: string }>(`/square/activities/${activityId}/cancel`, { userId });

export const getActivityTemplates = () =>
  request.get<{ templates: ActivityTemplate[]; total: number }>('/square/activity-templates');

// ==================== 音乐创作知识库 API ====================

export const getMusicKnowledge = (params?: { category?: string; difficulty?: string }) =>
  request.get<{ items: MusicKnowledgeItem[]; total: number }>('/square/music-knowledge', { params });

export const getMusicKnowledgeById = (id: number) =>
  request.get<MusicKnowledgeItem>(`/square/music-knowledge/${id}`);

export const getMusicKnowledgeCategories = () =>
  request.get<{ categories: MusicKnowledgeCategory[] }>('/square/music-knowledge-categories');

// ==================== 用户创作 API ====================

export const getUserCreations = (params?: {
  userId?: number;
  type?: string;
  page?: number;
  pageSize?: number;
}) => request.get<{ creations: UserCreation[]; total: number; page: number; pageSize: number }>('/square/creations', { params });

export const createUserCreation = (data: {
  userId: number;
  type: string;
  title: string;
  content: Record<string, unknown>;
  description?: string;
}) => request.post<{ id: number }>('/square/creations', data);

export const likeCreation = (id: number) =>
  request.post<{ success: boolean; message: string }>(`/square/creations/${id}/like`);

// ==================== 评论 API ====================

export interface Comment {
  id: number;
  target_type: string;
  target_id: number;
  user_id: number;
  user_name: string;
  content: string;
  parent_id: number | null;
  likes: number;
  gmt_create: string;
  replies?: Comment[];
}

export const getComments = (targetType: string, targetId: number, page?: number, pageSize?: number) =>
  request.get<{ comments: Comment[]; total: number }>('/square/comments', { params: { targetType, targetId, page, pageSize } });

export const addComment = (data: {
  targetType: string;
  targetId: number;
  userId: number;
  userName?: string;
  content: string;
  parentId?: number;
}) => request.post<{ id: number }>('/square/comments', data);

export const deleteComment = (id: number) =>
  request.delete<{ success: boolean; message: string }>(`/square/comments/${id}`);

// ==================== 通用点赞 API ====================

export const toggleLike = (targetType: string, targetId: number, userId: number) =>
  request.post<{ success: boolean; liked: boolean; message: string }>('/square/like/toggle', { targetType, targetId, userId });

export const getLikeCount = (targetType: string, targetId: number) =>
  request.get<{ count: number }>('/square/like/count', { params: { targetType, targetId } });

export const getLikeStatus = (targetType: string, targetId: number, userId: number) =>
  request.get<{ liked: boolean }>('/square/like/status', { params: { targetType, targetId, userId } });