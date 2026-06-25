import { request } from './request';

export interface SystemConfig {
  id: number;
  configKey: string;
  configName: string;
  configType: string;
  category: string;
  configValue: string;
  description: string;
  isEditable: number;
  sortOrder: number;
}

export interface ConfigMap {
  [key: string]: string;
}

export interface LLMTestResult {
  success: boolean;
  model: string;
  latency: number;
  reply: string;
  message: string;
}

export interface LLMModel {
  id: string;
  ownedBy: string;
}

export async function getConfigList(category?: string) {
  return request.get('/system-config/list', { params: category ? { category } : {} });
}

export async function getConfigMap(category?: string) {
  return request.get('/system-config/map', { params: category ? { category } : {} });
}

export async function updateConfig(key: string, value: string) {
  return request.put(`/system-config/${key}`, { value });
}

export async function testLLMConnection(params: {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
}) {
  return request.post('/system-config/test-llm', params);
}

export async function listLLMModels(params: {
  apiKey?: string;
  apiUrl?: string;
}) {
  return request.post('/system-config/list-models', params);
}