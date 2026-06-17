import { request } from './request';

// ==================== 类型定义 ====================

export interface User {
  id: number;
  username: string;
  phone: string;
  realName: string;
  role: string;
  communityId: number;
  status: number;
  lastLoginAt: string;
  gmtCreate: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}

export interface Elder {
  id: number;
  name: string;
  gender: number;
  age: number;
  communityId: number;
  riskLevel: number;
  tags: string[];
  status: number;
  gridUserName: string;
  guardianPhones: string[];
}

export interface ElderCreateParams {
  name: string;
  idCard: string;
  gender: number;
  birthDate: string;
  phone?: string;
  communityId: number;
  address?: string;
  riskLevel?: number;
  tags?: string[];
  gridUserId?: number;
  guardianUserId?: number;
  consentSigned?: boolean;
}

export interface CursorPage<T> {
  records: T[];
  nextCursor: number | null;
  size: number;
  hasMore: boolean;
}

export interface Event {
  id: number;
  elderId: number;
  deviceId: number;
  eventType: string;
  eventLevel: number;
  confidence: number;
  source: string;
  status: string;
  assignedUserId: number;
  closedBy: number;
  closedAt: string;
  closeReason: string;
  communityId: number;
  gmtCreate: string;
}

export interface Device {
  id: number;
  elderId: number;
  deviceType: string;
  vendor: string;
  sn: string;
  name: string;
  location: string;
  status: number;
  offlineCount: number;
  gmtCreate: string;
}

export interface PatrolRecord {
  id: number;
  elderId: number;
  userId: number;
  taskType: string;
  checkinAt: string;
  elderStatus: string;
  remark: string;
  followUpFlag: boolean;
  gmtCreate: string;
}

export interface DashboardSummary {
  communityId: number;
  totalElders: number;
  totalDevices: number;
  onlineDevices: number;
  todayEvents: number;
  todayL3Events: number;
  todayL4Events: number;
  avgResponseSeconds: number;
  falsePositiveRate: number;
}

// ==================== API 接口 ====================

// 登录
export const login = (params: LoginParams) =>
  request.post<LoginResult>('/auth/login', params);

// 获取当前用户信息
export const getCurrentUser = () =>
  request.get<User>('/auth/me');

// 老人档案列表（游标分页）
export const getElderList = (params: {
  communityId?: number;
  riskLevel?: number;
  cursor?: number;
  size?: number;
}) => request.get<CursorPage<Elder>>('/elder/page', { params });

// 获取老人详情
export const getElderDetail = (id: number) =>
  request.get<Elder>(`/elder/${id}`);

// 创建老人档案
export const createElder = (params: ElderCreateParams) =>
  request.post<number>('/elder', params);

// 更新老人档案
export const updateElder = (id: number, params: Partial<ElderCreateParams>) =>
  request.put<void>(`/elder/${id}`, params);

// 删除老人档案
export const deleteElder = (id: number) =>
  request.delete<void>(`/elder/${id}`);

// 事件列表（游标分页）
export const getEventList = (params: {
  communityId?: number;
  status?: string;
  eventLevel?: number;
  cursor?: number;
  size?: number;
}) => request.get<CursorPage<Event>>('/event/page', { params });

// 获取事件详情
export const getEventDetail = (id: number) =>
  request.get<Event>(`/event/${id}`);

// 分配事件
export const assignEvent = (eventId: number, userId: number) =>
  request.put<void>(`/event/${eventId}/assign`, { userId });

// 处理事件
export const handleEvent = (eventId: number, closeReason: string) =>
  request.put<void>(`/event/${eventId}/handle`, { closeReason });

// 标记误报
export const markFalseAlarm = (eventId: number, reason: string) =>
  request.put<void>(`/event/${eventId}/false-alarm`, { reason });

// 设备列表
export const getDeviceList = (params: {
  page?: number;
  size?: number;
  elderId?: number;
}) => request.get<{ records: Device[]; total: number }>('/device/list', { params });

// 驾驶舱数据
export const getDashboardSummary = (communityId?: number) =>
  request.get<DashboardSummary>('/dashboard/summary', { params: { communityId } });

// 巡检记录列表
export const getPatrolList = (params: {
  elderId?: number;
  userId?: number;
  cursor?: number;
  size?: number;
}) => request.get<CursorPage<PatrolRecord>>('/patrol/page', { params });