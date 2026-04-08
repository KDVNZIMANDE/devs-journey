"use client";

import { useEffect, useRef, useCallback } from "react";
import { SSEEventType } from "@/types";

type SSEHandler<T = unknown> = (data: T) => void;
type HandlerMap = Partial<Record<SSEEventType, SSEHandler>>;

/**
 * useSSE
 *
 * Connects to /api/feed and calls the provided handlers when events arrive.
 * Automatically reconnects on connection loss using exponential backoff.
 *
 * @example
 * useSSE({
 *   new_project: (data) => setProjects(prev => [data, ...prev]),
 *   new_comment: (data) => toast(`New comment on ${data.projectTitle}`),
 * });
 */
export function useSSE(handlers: HandlerMap) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const handlersRef = useRef(handlers);

  // Keep handlers ref current without re-connecting
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource("/api/feed");
    esRef.current = es;

    const eventTypes: SSEEventType[] = [
      "new_project",
      "project_updated",
      "project_completed",
      "new_milestone",
      "new_comment",
      "notification",
    ];

    eventTypes.forEach((type) => {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          handlersRef.current[type]?.(data);
        } catch {
          console.error(`[useSSE] Failed to parse event: ${type}`);
        }
      });
    });

    es.onopen = () => {
      retryRef.current = 0; // Reset backoff on successful connection
    };

    es.onerror = () => {
      es.close();
      // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
      const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
      retryRef.current += 1;
      setTimeout(connect, delay);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);
}
