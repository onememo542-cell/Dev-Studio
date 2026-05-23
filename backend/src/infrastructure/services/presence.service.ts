/**
 * PresenceService
 *
 * Tracks which users are currently online and propagates that state across
 * server instances via Redis pub/sub.  When Redis is unavailable it falls back
 * to an in-process Map so the feature degrades gracefully on a single instance.
 *
 * Channel format:  "presence"   (all servers publish here)
 *
 * Message format (JSON):
 *   { event: "join" | "leave" | "heartbeat", userId: string, meta?: object }
 */

import { redisPublisher, redisSubscriber } from "../lib/redis.js";
import { logger } from "../lib/logger.js";

export type PresenceEvent = "join" | "leave" | "heartbeat";

export interface PresenceMessage {
  event: PresenceEvent;
  userId: string;
  meta?: Record<string, unknown>;
}

export type PresenceChangeListener = (msg: PresenceMessage) => void;

const CHANNEL = "presence";

/** In-process store used when Redis is not available */
const localOnline = new Map<string, number>(); // userId -> lastSeen timestamp

export class PresenceService {
  private listeners = new Set<PresenceChangeListener>();

  constructor() {
    this.setupSubscriber();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async join(userId: string, meta?: Record<string, unknown>): Promise<void> {
    localOnline.set(userId, Date.now());
    await this.publish({ event: "join", userId, meta });
  }

  async leave(userId: string): Promise<void> {
    localOnline.delete(userId);
    await this.publish({ event: "leave", userId });
  }

  async heartbeat(userId: string): Promise<void> {
    localOnline.set(userId, Date.now());
    await this.publish({ event: "heartbeat", userId });
  }

  /** Returns the set of users seen in the last `ttlMs` milliseconds (local view only). */
  getOnline(ttlMs = 60_000): string[] {
    const cutoff = Date.now() - ttlMs;
    return [...localOnline.entries()]
      .filter(([, ts]) => ts >= cutoff)
      .map(([id]) => id);
  }

  onPresenceChange(listener: PresenceChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private async publish(msg: PresenceMessage): Promise<void> {
    if (!redisPublisher) {
      this.emit(msg);
      return;
    }
    try {
      await redisPublisher.publish(CHANNEL, JSON.stringify(msg));
    } catch (err) {
      logger.warn("PresenceService: publish failed", { err });
      this.emit(msg);
    }
  }

  private setupSubscriber(): void {
    if (!redisSubscriber) {
      logger.info("PresenceService: Redis unavailable — using in-process fallback");
      return;
    }

    redisSubscriber.subscribe(CHANNEL, (err) => {
      if (err) {
        logger.warn("PresenceService: subscribe failed", { message: err.message });
      } else {
        logger.info(`PresenceService: subscribed to channel "${CHANNEL}"`);
      }
    });

    redisSubscriber.on("message", (_channel: string, payload: string) => {
      try {
        const msg = JSON.parse(payload) as PresenceMessage;
        // Keep local map in sync with remote messages
        if (msg.event === "leave") {
          localOnline.delete(msg.userId);
        } else {
          localOnline.set(msg.userId, Date.now());
        }
        this.emit(msg);
      } catch {
        // malformed payload — ignore
      }
    });
  }

  private emit(msg: PresenceMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch {
        // listener threw — continue
      }
    }
  }
}

export const presenceService = new PresenceService();
