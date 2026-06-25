import { request } from './request';

export interface HealthRecord {
  id: number;
  elder_id: number;
  record_date: string;
  blood_pressure_sys: number | null;
  blood_pressure_dia: number | null;
  blood_glucose: number | null;
  heart_rate: number | null;
  blood_oxygen: number | null;
  body_temp: number | null;
  sleep_hours: number | null;
  steps: number | null;
  weight: number | null;
  tcm_constitution: string | null;
  mood: string | null;
  source: string;
  remark: string | null;
  gmt_create: string;
}

export interface HealthTrend {
  dates: string[];
  blood_pressure_sys: (number | null)[];
  blood_pressure_dia: (number | null)[];
  blood_glucose: (number | null)[];
  heart_rate: (number | null)[];
  blood_oxygen: (number | null)[];
  body_temp: (number | null)[];
  sleep_hours: (number | null)[];
  steps: (number | null)[];
}

export interface HealthSummary {
  avg: Record<string, number>;
  min: Record<string, number>;
  max: Record<string, number>;
  total_records: number;
}

export async function getHealthRecords(elderId: number, days?: number) {
  return request.get('/health/records', { params: { elderId, days } });
}

export async function getHealthTrend(elderId: number, days?: number) {
  return request.get('/health/trend', { params: { elderId, days } });
}

export async function getLatestHealth(elderId: number) {
  return request.get('/health/latest', { params: { elderId } });
}

export async function getHealthSummary(elderId: number, days?: number) {
  return request.get('/health/summary', { params: { elderId, days } });
}

export async function addHealthRecord(data: Partial<HealthRecord> & { elderId: number }) {
  return request.post('/health/records', data);
}