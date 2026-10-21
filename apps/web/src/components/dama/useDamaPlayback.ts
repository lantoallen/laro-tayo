"use client";

import { useEffect, useMemo, useState } from "react";
import type { Seat } from "@laro/games";
import { applyEvent, play, type DamaEvent, type DamaMove, type DamaState, type Piece } from "@laro/games/dama";
import { playSound, type SoundName } from "@/lib/sound";

const SOUNDS: Partial<Record<DamaEvent["type"], SoundName>> = { step: "place", capture: "capture", promote: "match" };

export type Speed = "normal" | "fast";

/** Milliseconds to show each step of a move, plus how long a bot waits before playing. */
export const DELAYS: Record<Speed, Record<DamaEvent["type"] | "think" | "settle", number>> = {
  normal: { step: 280, capture: 320, promote: 420, gameOver: 200, think: 650, settle: 150 },
  fast: { step: 110, capture: 150, promote: 180, gameOver: 100, think: 300, settle: 80 },
};

/** A move being shown step by step. The real game state only updates once it finishes. */
interface Playback {
  seat: Seat;
  start: Piece[];
  events: DamaEvent[];
  shown: number;
  final: DamaState;
}

export interface DamaFrame {
  board: Piece[];
  /** Pieces that will be captured when the move finishes. */
  captured: number[];
  /** Where the moving piece started and where it is now. */
  last: number[];
}

function frameOf(playback: Playback): DamaFrame {
  let board = playback.start;
  const shown = playback.events.slice(0, playback.shown);
  for (const event of shown) board = applyEvent(board, event);
  const steps = playback.events.filter((event) => event.type === "step");
  const taken = playback.events.find((event) => event.type === "capture");
  const removed = shown.some((event) => event.type === "capture");
  const lastStep = shown.filter((event) => event.type === "step").at(-1);
  return {
    board,
    captured: taken && !removed ? taken.squares : [],
    last: steps.length > 0 ? [steps[0].from, lastStep?.to ?? steps[0].from] : [],
  };
}

/** Holds a Dama game and plays each move out one hop at a time. */
export function useDamaPlayback(initial: () => DamaState, speed: Speed) {
  const [game, setGame] = useState(initial);
  const [playback, setPlayback] = useState<Playback | null>(null);
  const [lastMove, setLastMove] = useState<Playback | null>(null);

  useEffect(() => {
    if (!playback) return;
    const finished = playback.shown >= playback.events.length;
    const delay = finished ? DELAYS[speed].settle : DELAYS[speed][playback.events[playback.shown].type];
    const timer = setTimeout(() => {
      if (finished) {
        setGame(playback.final);
        setLastMove(playback);
        setPlayback(null);
      } else {
        const sound = SOUNDS[playback.events[playback.shown].type];
        if (sound) playSound(sound);
        setPlayback({ ...playback, shown: playback.shown + 1 });
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [playback, speed]);

  const frame = useMemo(() => (playback ? frameOf(playback) : null), [playback]);
  // After a move finishes, keep showing where it went.
  const last = frame?.last ?? (lastMove ? frameOf({ ...lastMove, shown: lastMove.events.length }).last : []);
  const events = playback ? playback.events.slice(0, playback.shown) : (lastMove?.events ?? []);
  const mover = playback?.seat ?? lastMove?.seat ?? null;

  /** Plays out a move that has already been decided, such as one sent by a server. */
  function show(seat: Seat, moveEvents: DamaEvent[], final: DamaState) {
    const start = playback ? playback.final : game;
    if (playback) setGame(playback.final);
    setPlayback({ seat, start: start.board, events: moveEvents, shown: 0, final });
  }

  function move(seat: Seat, path: DamaMove) {
    const current = playback ? playback.final : game;
    const { state: final, events: moveEvents } = play(current, seat, path);
    show(seat, moveEvents, final);
  }

  function restart(state: DamaState) {
    setPlayback(null);
    setLastMove(null);
    setGame(state);
  }

  return {
    game,
    playing: playback !== null,
    frame,
    board: frame?.board ?? game.board,
    last,
    events,
    mover,
    move,
    show,
    restart,
  };
}
