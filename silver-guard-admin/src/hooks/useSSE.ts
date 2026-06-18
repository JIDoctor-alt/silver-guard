// ============================================================
// Silver Guard · SSE 客户端 Hook
// 连接后端 SSE 实时推送，接收事件通知
// ============================================================
import { useEffect, useRef, useCallback, useState } from 'react';

export interface SSEEvent {
  event: string;
  data: string;
}

interface UseSSEOptions {
  onMessage?: (event: SSEEvent) => void;
  onEvent?: (eventType: string, data: unknown) => void;
  onConnected?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function useSSE(options: UseSSEOptions = {}) {
  const { onMessage, onEvent, onConnected, onError, enabled = true } = options;
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    // 关闭已有连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = localStorage.getItem('token');
    const url = token ? `/api/sse/connect?token=${encodeURIComponent(token)}` : '/api/sse/connect';

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setConnected(true);
      onConnected?.();
    });

    es.addEventListener('heartbeat', () => {
      // 心跳，保持连接
    });

    // 通用消息监听
    es.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const sseEvent: SSEEvent = { event: event.type, data: event.data };
        setLastEvent(sseEvent);
        onMessage?.(sseEvent);
        onEvent?.(event.type, data);
      } catch {
        // 非 JSON 数据忽略
      }
    };

    // 监听特定事件类型
    const eventTypes = ['alert', 'device_status', 'patrol_update', 'event_update', 'notification'];
    eventTypes.forEach((eventType) => {
      es.addEventListener(eventType, (event: Event) => {
        const msgEvent = event as MessageEvent;
        try {
          const data = JSON.parse(msgEvent.data);
          onEvent?.(eventType, data);
        } catch {
          // ignore
        }
      });
    });

    es.onerror = (error: Event) => {
      setConnected(false);
      onError?.(error);
      // 自动重连由 EventSource 处理
    };
  }, [enabled, onMessage, onEvent, onConnected, onError]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { connected, lastEvent, reconnect: connect, disconnect };
}