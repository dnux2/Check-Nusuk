import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { ChatMessage } from "@shared/schema";

let wss: WebSocketServer | null = null;

export function setupWebSocket(httpServer: Server) {
  wss = new WebSocketServer({ server: httpServer, path: "/ws/chat" });

  wss.on("connection", (socket) => {
    socket.on("error", (err) => {
      console.error("[ws] client error:", err.message);
    });
  });

  console.log("[ws] WebSocket server ready at /ws/chat");
}

export function broadcastChatMessage(msg: ChatMessage) {
  if (!wss) return;
  const payload = JSON.stringify({ type: "chat_message", data: msg });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}
