"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "./auth";

interface UseSSEOptions {
  onTicketCreated?: (data: any) => void;
  onTicketUpdated?: (data: any) => void;
  onNewMessage?: (data: any) => void;
}

export function useTicketStream(options: UseSSEOptions) {
  const { token } = useAuth();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!token) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const streamUrl = `${apiBase}/stream/tickets?token=${encodeURIComponent(token)}`;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener("ticket_created", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            optionsRef.current.onTicketCreated?.(parsed.data);
          } catch (_) {}
        });

        eventSource.addEventListener("ticket_updated", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            optionsRef.current.onTicketUpdated?.(parsed.data);
          } catch (_) {}
        });

        eventSource.addEventListener("new_message", (e: MessageEvent) => {
          try {
            const parsed = JSON.parse(e.data);
            optionsRef.current.onNewMessage?.(parsed.data);
          } catch (_) {}
        });

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          // Attempt reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [token]);
}
