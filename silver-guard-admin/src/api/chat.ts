/**
 * ============================================================
 * 乐龄守护 · RAG 智能问答 API
 * 支持：同步问答、SSE 流式响应、文档管理
 * ============================================================
 */

import request from './request';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  isMock?: boolean;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  isMock: boolean;
}

export interface SearchResult {
  title: string;
  snippet: string;
  isMock: boolean;
}

export async function sendMessage(message: string): Promise<ChatResponse> {
  const res = await request.post('/chat', { message });
  return res.data;
}

export function streamMessage(message: string, onChunk: (content: string) => void, onEnd: (result: ChatResponse) => void): () => void {
  const token = localStorage.getItem('token');
  const url = new URL(`${request.defaults.baseURL}/chat/stream`);
  url.searchParams.set('message', encodeURIComponent(message));
  url.searchParams.set('token', token || '');

  const abortController = new AbortController();

  fetch(url.toString(), {
    signal: abortController.signal,
    headers: {
      'Accept': 'text/event-stream',
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'chunk') {
              onChunk(data.content);
            } else if (data.type === 'end') {
              onEnd(data);
              return;
            }
          } catch (error) {
            console.error('[SSE] 解析数据失败:', error);
          }
        }
      }
    }
  }).catch((error) => {
    console.error('[SSE] 连接错误:', error);
    onEnd({
      answer: '连接已断开，请重试',
      sources: [],
      isMock: true,
    });
  });

  return () => {
    abortController.abort();
  };
}

export async function addDocument(title: string, content: string): Promise<void> {
  await request.post('/chat/document', { title, content });
}

export async function searchDocuments(query: string, limit: number = 5): Promise<SearchResult[]> {
  const res = await request.get('/chat/search', { params: { query, limit } });
  return res.data.results;
}
