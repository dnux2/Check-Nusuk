import { useEffect, useRef, useCallback } from "react";
import { queryClient } from "@/lib/queryClient";
import type { ChatMessage } from "@shared/schema";

type WsStatus = "connecting" | "open" | "closed";

export function useChatWebSocket(onMessage?: (msg: ChatMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<WsStatus>("closed");
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}/ws/chat`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    statusRef.current = "connecting";

    ws.onopen = () => {
      statusRef.current = "open";
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        if (payload.type === "chat_message") {
          const msg: ChatMessage = payload.data;
          queryClient.setQueryData<ChatMessage[]>(
            ["/api/chat/messages"],
            (old = []) => {
              if (old.some((m) => m.id === msg.id)) return old;
              return [...old, msg];
            }
          );
          onMessage?.(msg);
        }
      } catch {
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onclose = () => {
      statusRef.current = "closed";
      if (mountedRef.current) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };
  }, [onMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return statusRef;
}
