"use client";

import { useEffect, useMemo, useState } from "react";
import type { Seat } from "@laro/games";
import { applyEvent, play, type SungkaEvent, type SungkaState } from "@laro/games/sungka";

export type Speed = "normal" | "fast";

/** Milliseconds to show each step of a move, plus how long a bot waits before playing. */
export const DELAYS: Record<Speed, Record<SungkaEvent["type"] | "think" | "settle", number>> = {
  normal: { pickup: 320, drop: 150, capture: 700, extraTurn: 600, pass: 800, gameOver: 300, think: 750, settle: 250 },
  fast: { pickup: 120, drop: 55, capture: 320, extraTurn: 280, pass: 400, gameOver: 150, think: 350, settle: 120 },
};

/** A move being shown step by step. The real game state only updates once it finishes. */
export interface Sowing {
  seat: Seat;
  start: number[];
  events: SungkaEvent[];
  shown: number;
  final: SungkaState;
}

/** What the board looks like partway through a move. */
export interface Frame {
  board: number[];
  active: number | null;
  hand: number;
  captured: number[];
}

function frameOf(sowing: Sowing): Frame {
  const frame: Frame = { board: sowing.start, active: null, hand: 0, captured: [] };
  for (const event of sowing.events.slice(0, sowing.shown)) {
    frame.board = applyEvent(frame.board, event);
    if (event.type === "pickup") {
      frame.active = event.slot;
      frame.hand = event.count;
    } else if (event.type === "drop") {
      frame.active = event.slot;
      frame.hand--;
    } else if (event.type === "capture") {
      frame.active = event.store;
      frame.captured = event.from;
    }
  }
  return frame;
}

/**
 * Holds a Sungka game and plays each move out one step at a time.
 * `events` is what has happened so far in the move being shown, or the whole
 * last move once it's done, so screens can show messages like "Huli!".
 */
export function useSowing(initial: () => SungkaState, speed: Speed) {
  const [game, setGame] = useState(initial);
  const [sowing, setSowing] = useState<Sowing | null>(null);
  const [lastMove, setLastMove] = useState<Sowing | null>(null);

  useEffect(() => {
    if (!sowing) return;
    const finished = sowing.shown >= sowing.events.length;
    const delay = finished ? DELAYS[speed].settle : DELAYS[speed][sowing.events[sowing.shown].type];
    const timer = setTimeout(() => {
      if (finished) {
        setGame(sowing.final);
        setLastMove(sowing);
        setSowing(null);
      } else {
        setSowing({ ...sowing, shown: sowing.shown + 1 });
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [sowing, speed]);

  const frame = useMemo(() => (sowing ? frameOf(sowing) : null), [sowing]);
  const events = sowing ? sowing.events.slice(0, sowing.shown) : (lastMove?.events ?? []);

  function move(seat: Seat, house: number) {
    const { state: final, events } = play(game, seat, house);
    setSowing({ seat, start: game.board, events, shown: 0, final });
  }

  function restart(state: SungkaState) {
    setSowing(null);
    setLastMove(null);
    setGame(state);
  }

  return { game, sowing, frame, events, board: frame?.board ?? game.board, move, restart };
}
