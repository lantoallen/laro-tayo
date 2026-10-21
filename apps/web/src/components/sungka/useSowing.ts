"use client";

import { useEffect, useMemo, useState } from "react";
import type { Seat } from "@laro/games";
import { applyEvent, play, type SungkaEvent, type SungkaState } from "@laro/games/sungka";
import { playSound, type SoundName } from "@/lib/sound";

/** A soft click for each shell, and bigger sounds for captures and extra turns. */
const SOUNDS: Partial<Record<SungkaEvent["type"], SoundName>> = {
  pickup: "tap",
  drop: "drop",
  capture: "capture",
  extraTurn: "match",
  pass: "miss",
};

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
 * Holds a Sungka game and plays each move out one step at a time, with a
 * sound for each step unless `quiet` is set, as it is for the demo.
 * `events` is what has happened so far in the move being shown, or the whole
 * last move once it's done, so screens can show messages like "Huli!".
 */
export function useSowing(initial: () => SungkaState, speed: Speed, { quiet = false } = {}) {
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
        const sound = SOUNDS[sowing.events[sowing.shown].type];
        if (sound && !quiet) playSound(sound);
        setSowing({ ...sowing, shown: sowing.shown + 1 });
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [quiet, sowing, speed]);

  const frame = useMemo(() => (sowing ? frameOf(sowing) : null), [sowing]);
  const events = sowing ? sowing.events.slice(0, sowing.shown) : (lastMove?.events ?? []);

  /**
   * Plays out a move that has already been decided, such as one sent by the server.
   * If another move is still being shown, it jumps to that move's end first.
   */
  function show(seat: Seat, events: SungkaEvent[], final: SungkaState) {
    const start = sowing ? sowing.final : game;
    if (sowing) setGame(sowing.final);
    setSowing({ seat, start: start.board, events, shown: 0, final });
  }

  function move(seat: Seat, house: number) {
    const current = sowing ? sowing.final : game;
    const { state: final, events } = play(current, seat, house);
    show(seat, events, final);
  }

  function restart(state: SungkaState) {
    setSowing(null);
    setLastMove(null);
    setGame(state);
  }

  return { game, sowing, frame, events, board: frame?.board ?? game.board, move, show, restart };
}
