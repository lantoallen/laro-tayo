"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Seat } from "@laro/games";
import {
  PING,
  PONG,
  ROOM_NOT_FOUND,
  type ClientMessage,
  type MoveRecord,
  type Reaction,
  type RoomSnapshot,
  type ServerMessage,
} from "@laro/rooms";
import type { LocalPlayer } from "./player";
import { socketUrl } from "./rooms";

export type ConnectionStatus = "connecting" | "open" | "reconnecting" | "missing";

export interface RoomUpdate {
  room: RoomSnapshot;
  lastMove?: MoveRecord;
}

/** A reaction someone sent, shown for a moment. `id` tells two of the same reaction apart. */
export interface ShownReaction {
  id: number;
  seat: Seat;
  reaction: Reaction;
}

/** How long a reaction stays on screen. */
export const REACTION_MS = 2600;

/** Phones and proxies drop quiet connections, so send a small ping now and then. */
const PING_EVERY_MS = 25_000;
const MAX_RETRY_DELAY_MS = 10_000;

/**
 * Keeps a WebSocket to a room open. It says hello as the given player, keeps
 * the latest update from the server, and reconnects with growing pauses if the
 * connection drops.
 */
export function useRoom(code: string, player: LocalPlayer | null) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [update, setUpdate] = useState<RoomUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The server's ROOM_VERSION, once it has sent something. Servers from before versions existed count as 0.
  const [serverVersion, setServerVersion] = useState<number | null>(null);
  const [reactions, setReactions] = useState<ShownReaction[]>([]);
  const socket = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!player) return;
    const me = player;
    let stopped = false;
    let attempts = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let reactionId = 0;
    const fading = new Set<ReturnType<typeof setTimeout>>();

    function connect() {
      const ws = new WebSocket(socketUrl(code));
      socket.current = ws;
      ws.onopen = () => {
        attempts = 0;
        setStatus("open");
        ws.send(JSON.stringify({ type: "hello", playerId: me.id, name: me.name } satisfies ClientMessage));
      };
      ws.onmessage = (event) => {
        if (event.data === PONG) return;
        const message = JSON.parse(event.data) as ServerMessage;
        if (message.type === "room") {
          setUpdate({ room: message.room, lastMove: message.lastMove });
          setServerVersion(message.version ?? 0);
        } else if (message.type === "reaction") {
          const shown = { id: ++reactionId, seat: message.seat, reaction: message.reaction };
          // Keep a few at most, so a burst doesn't fill the screen.
          setReactions((list) => [...list.slice(-3), shown]);
          const timer = setTimeout(() => {
            fading.delete(timer);
            setReactions((list) => list.filter((reaction) => reaction.id !== shown.id));
          }, REACTION_MS);
          fading.add(timer);
        } else setError(message.message);
      };
      ws.onclose = (event) => {
        if (stopped) return;
        if (event.code === ROOM_NOT_FOUND) {
          setStatus("missing");
          return;
        }
        setStatus("reconnecting");
        retry = setTimeout(connect, Math.min(1000 * 2 ** attempts++, MAX_RETRY_DELAY_MS));
      };
    }

    connect();
    const ping = setInterval(() => {
      if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(PING);
    }, PING_EVERY_MS);

    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(ping);
      fading.forEach(clearTimeout);
      socket.current?.close(1000);
      socket.current = null;
    };
  }, [code, player]);

  /** Sends a message. Returns false if the connection isn't open right now. */
  const send = useCallback((message: ClientMessage): boolean => {
    const ws = socket.current;
    if (ws?.readyState !== WebSocket.OPEN) return false;
    setError(null);
    ws.send(JSON.stringify(message));
    return true;
  }, []);

  return { status, update, error, send, serverVersion, reactions };
}
