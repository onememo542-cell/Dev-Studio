/**
 * WebSocket Presence Handler
 *
 * Manages a pool of WebSocket connections and bridges them to the
 * PresenceService (Redis pub/sub or in-process fallback).
 *
 * Protocol (text frames, JSON):
 *
 *   Client → Server
 *     { type: "identify", userId: string }     — sent once after connect
 *     { type: "heartbeat" }                    — keep-alive ping (every 30 s)
 *     { type: "leave" }                        — explicit disconnect
 *
 *   Server → Client
 *     { type: "presence", online: string[] }   — current online list
 *     { type: "change",   event, userId }      — incremental update
 *     { type: "pong" }                         — heartbeat ack
 */

import { IncomingMessage, Server as HttpServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { presenceService, PresenceMessage } from "../../infrastructure/services/presence.service.js";
import { logger } from "../../infrastructure/lib/logger.js";

interface Connection {
  ws: WebSocket;
  userId?: string;
  heartbeatTimer?: ReturnType<typeof setTimeout>;
}

const HEARTBEAT_TIMEOUT_MS = 90_000; // disconnect if no heartbeat for 90 s

export function attachPresenceWS(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws/presence" });
  const connections = new Map<WebSocket, Connection>();

  // Forward every Redis pub/sub change to all identified connections
  const unsubscribe = presenceService.onPresenceChange((msg: PresenceMessage) => {
    const payload = JSON.stringify({ type: "change", event: msg.event, userId: msg.userId });
    for (const [, conn] of connections) {
      if (conn.userId && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(payload);
      }
    }
  });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    const conn: Connection = { ws };
    connections.set(ws, conn);

    resetHeartbeatTimer(conn);

    ws.on("message", async (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      } catch {
        return;
      }

      if (msg.type === "identify" && typeof msg.userId === "string") {
        conn.userId = msg.userId;
        await presenceService.join(msg.userId);
        // Send current roster to the newly identified client
        sendPresence(ws);
        return;
      }

      if (msg.type === "heartbeat") {
        if (conn.userId) await presenceService.heartbeat(conn.userId);
        resetHeartbeatTimer(conn);
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }

      if (msg.type === "leave") {
        await handleDisconnect(conn);
        ws.close();
      }
    });

    ws.on("close", () => {
      clearTimeout(conn.heartbeatTimer);
      handleDisconnect(conn);
      connections.delete(ws);
    });

    ws.on("error", (err) => {
      logger.warn("Presence WS error", { message: err.message });
    });
  });

  wss.on("close", () => {
    unsubscribe();
  });

  logger.info("Presence WebSocket server attached at /ws/presence");
  return wss;

  // ---------------------------------------------------------------------------

  function sendPresence(ws: WebSocket) {
    if (ws.readyState !== WebSocket.OPEN) return;
    const online = presenceService.getOnline();
    ws.send(JSON.stringify({ type: "presence", online }));
  }

  async function handleDisconnect(conn: Connection) {
    if (conn.userId) {
      await presenceService.leave(conn.userId);
      conn.userId = undefined;
    }
  }

  function resetHeartbeatTimer(conn: Connection) {
    clearTimeout(conn.heartbeatTimer);
    conn.heartbeatTimer = setTimeout(async () => {
      await handleDisconnect(conn);
      if (conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.terminate();
      }
      connections.delete(conn.ws);
    }, HEARTBEAT_TIMEOUT_MS);
  }
}
