"use client";

import { useEffect, useState } from "react";
import { LOOKING_ELSEWHERE, PING, PONG, type ClientMessage, type GameId, type MatchMessage } from "@laro/rooms";
import type { LocalPlayer } from "./player";
import { matchSocketUrl } from "./rooms";

export type MatchStatus = "connecting" | "looking" | "reconnecting" | "elsewhere";

const PING_EVERY_MS = 25_000;
const MAX_RETRY_DELAY_MS = 10_000;

/**
 * Waits in the lobby for others who want the same game. Calls `onMatched`
 * with the room code once there are enough people, and reconnects if the
 * connection drops.
 */
export function useMatch(game: GameId, players: number, player: LocalPlayer, onMatched: (code: string) => void) {
  const [status, setStatus] = useState<MatchStatus>("connecting");
  const [here, setHere] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let attempts = 0;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let ws: WebSocket;

    function connect() {
      ws = new WebSocket(matchSocketUrl(game, players));
      ws.onopen = () => {
        attempts = 0;
        setStatus("looking");
        ws.send(JSON.stringify({ type: "hello", playerId: player.id, name: player.name } satisfies ClientMessage));
      };
      ws.onmessage = (event) => {
        if (event.data === PONG) return;
        const message = JSON.parse(event.data) as MatchMessage;
        if (message.type === "waiting") setHere(message.here);
        else if (message.type === "matched") {
          stopped = true;
          onMatched(message.code);
        } else setError(message.message);
      };
      ws.onclose = (event) => {
        if (stopped) return;
        if (event.code === LOOKING_ELSEWHERE) {
          setStatus("elsewhere");
          return;
        }
        setStatus("reconnecting");
        retry = setTimeout(connect, Math.min(1000 * 2 ** attempts++, MAX_RETRY_DELAY_MS));
      };
    }

    connect();
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(PING);
    }, PING_EVERY_MS);

    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(ping);
      ws.close(1000);
    };
    // onMatched only runs once, when the match is made, so a new one each render doesn't matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, players, player]);

  return { status, here, error };
}
