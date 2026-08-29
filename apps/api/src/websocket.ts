import type http from "http";
import { Redis } from "ioredis";
import { WebSocket, WebSocketServer } from "ws";
import { ASSIGNMENT_EVENTS_CHANNEL, assignmentEventSchema, type AssignmentEvent } from "@veda/shared";
import { redisConnection } from "./config.js";

const clientsByAssignment = new Map<string, Set<WebSocket>>();

function send(socket: WebSocket, event: AssignmentEvent) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(event));
  }
}

export function emitAssignmentEvent(event: AssignmentEvent) {
  const clients = clientsByAssignment.get(event.assignmentId);
  if (!clients) return;
  for (const socket of clients) send(socket, event);
}

export function initWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    const subscriptions = new Set<string>();

    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as { type?: string; assignmentId?: string };
        if (message.type !== "subscribe" || !message.assignmentId) return;

        subscriptions.add(message.assignmentId);
        const clients = clientsByAssignment.get(message.assignmentId) ?? new Set<WebSocket>();
        clients.add(socket);
        clientsByAssignment.set(message.assignmentId, clients);
      } catch {
        send(socket, { assignmentId: "unknown", status: "failed", message: "Invalid websocket message" });
      }
    });

    socket.on("close", () => {
      for (const assignmentId of subscriptions) {
        const clients = clientsByAssignment.get(assignmentId);
        clients?.delete(socket);
        if (clients?.size === 0) clientsByAssignment.delete(assignmentId);
      }
    });
  });

  console.log("[api] websocket server ready");
  return wss;
}

export async function startEventBridge() {
  const subscriber = new Redis(redisConnection);
  await subscriber.subscribe(ASSIGNMENT_EVENTS_CHANNEL);
  subscriber.on("message", (_channel: string, message: string) => {
    const parsed = assignmentEventSchema.safeParse(JSON.parse(message));
    if (parsed.success) emitAssignmentEvent(parsed.data);
  });
  console.log("[api] websocket Redis event bridge ready");
  return subscriber;
}
