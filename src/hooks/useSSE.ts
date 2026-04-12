"use client";

import { useEffect, useRef, useCallback } from "react";
import { SSEEventType } from "@/types";

type SSEHandler<T = unknown> = (data: T) => void;
type HandlerMap = Partial<Record<SSEEventType, SSEHandler>>;

export function useSSE(handlers: HandlerMap) {
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef(0);
  const handlersRef = useRef(handlers);
  const connectRef = useRef<() => void>(() => {});

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
      retryRef.current = 0;
    };

    es.onerror = () => {
      es.close();
      const delay = Math.min(1000 * 2 ** retryRef.current, 30_000);
      retryRef.current += 1;
      setTimeout(() => connectRef.current(), delay);
    };
  }, []);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
    };
  }, [connect]);
}