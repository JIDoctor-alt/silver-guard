import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API 响应结构（与后端 ApiResult 对应）
export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
  traceId: string;
}

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加 token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 添加 traceId
    const traceId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    config.headers['X-Trace-Id'] = traceId;
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResult<unknown>>) => {
    const { data } = response;
    // code 0（音乐/RAG等接口）或 code 200（通用接口）均为成功
    if (data.code === 0 || data.code === 200) {
      return response;
    }
    // 业务错误
    if (data.code === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(new Error(data.message || '请求失败'));
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 封装请求方法
export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return instance.get(url, config).then((res) => res.data);
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return instance.post(url, data, config).then((res) => res.data);
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return instance.put(url, data, config).then((res) => res.data);
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResult<T>> {
    return instance.delete(url, config).then((res) => res.data);
  },
};

export default instance;