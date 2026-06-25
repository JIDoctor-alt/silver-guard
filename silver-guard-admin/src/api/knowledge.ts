import { request } from './request';

export interface ConstitutionAssessment {
  id: number;
  elder_id: number;
  assess_date: string;
  constitution: string;
  score: number;
  features: string[];
  recommendations: string[];
  assessed_by: string | null;
  gmt_create: string;
}

export interface SolarTermHealth {
  id: number;
  term_name: string;
  term_order: number;
  season: string;
  summary: string;
  diet: string[];
  exercise: string[];
  acupoints: string[];
  lifestyle: string;
  recipes: string[];
}

export interface AntiFraudKnowledge {
  id: number;
  category: string;
  title: string;
  description: string;
  warning_signs: string[];
  prevention: string;
  risk_level: string;
}

export interface PolicyKnowledge {
  id: number;
  category: string;
  title: string;
  summary: string;
  detail: string | null;
  applicable_region: string | null;
  effective_date: string | null;
  keywords: string[];
}

export async function getConstitutionAssessments(elderId: number) {
  return request.get('/knowledge/constitution', { params: { elderId } });
}

export async function addConstitutionAssessment(data: {
  elderId: number;
  assessDate: string;
  constitution: string;
  score: number;
  features?: string[];
  recommendations?: string[];
  assessedBy?: string;
}) {
  return request.post('/knowledge/constitution', data);
}

export async function getSolarTermHealth(termName?: string) {
  return request.get('/knowledge/solar-term', { params: termName ? { termName } : {} });
}

export async function getSolarTermList() {
  return request.get('/knowledge/solar-term/list');
}

export async function getAntiFraudKnowledge(category?: string) {
  return request.get('/knowledge/anti-fraud', { params: category ? { category } : {} });
}

export async function addAntiFraudKnowledge(data: {
  title: string;
  description: string;
  warning_signs?: string[];
  prevention?: string;
  risk_level?: string;
  category?: string;
}) {
  return request.post('/knowledge/anti-fraud', data);
}

export async function getPolicyKnowledge(category?: string) {
  return request.get('/knowledge/policy', { params: category ? { category } : {} });
}

export async function addPolicyKnowledge(data: {
  title: string;
  summary: string;
  detail?: string;
  applicable_region?: string;
  effective_date?: string;
  keywords?: string[];
  category?: string;
}) {
  return request.post('/knowledge/policy', data);
}