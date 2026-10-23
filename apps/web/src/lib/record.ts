"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { BotLevel } from "@laro/games";

/**
 * A win and loss count for each game, kept on this phone only. Games against
 * a bot are counted by level, and games online are counted together.
 */
export type Opponent = BotLevel | "bot" | "online";
export const OPPONENTS: readonly Opponent[] = ["easy", "medium", "hard", "bot", "online"];

export interface Tally {
  wins: number;
  losses: number;
  draws: number;
}

export type GameRecord = Partial<Record<Opponent, Tally>>;
type Records = Record<string, GameRecord>;

const KEY = "laro-tayo:records";
/** Online games already counted, so opening a finished game again doesn't count it twice. */
const COUNTED_KEY = "laro-tayo:counted-games";
const COUNTED_LIMIT = 50;

const listeners = new Set<() => void>();
let cached: Records | undefined;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Without storage the record just isn't kept.
  }
}

function snapshot(): Records {
  if (cached === undefined) cached = read<Records>(KEY, {});
  return cached;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The record for one game, or null before the page has loaded it. */
export function useGameRecord(gameId: string): GameRecord | null {
  const records = useSyncExternalStore<Records | null>(subscribe, snapshot, () => null);
  return records === null ? null : (records[gameId] ?? {});
}

function addResult(gameId: string, opponent: Opponent, outcome: keyof Tally) {
  const records = snapshot();
  const tally = records[gameId]?.[opponent] ?? { wins: 0, losses: 0, draws: 0 };
  cached = { ...records, [gameId]: { ...records[gameId], [opponent]: { ...tally, [outcome]: tally[outcome] + 1 } } };
  write(KEY, cached);
  for (const listener of listeners) listener();
}

/**
 * Counts a game once it ends. `opponent` is null for games that don't count,
 * like pass and play, and `you` is null for someone watching. Online games pass
 * `gameKey`, the room code and round, so each one is only counted once.
 */
export function useRecordResult(
  gameId: string,
  opponent: Opponent | null,
  winners: readonly number[] | null,
  you: number | null,
  gameKey?: string,
) {
  const counted = useRef(false);
  const over = winners !== null;
  useEffect(() => {
    if (!over) {
      counted.current = false;
      return;
    }
    if (counted.current || opponent === null || you === null) return;
    counted.current = true;
    if (gameKey) {
      const seen = read<string[]>(COUNTED_KEY, []);
      if (seen.includes(gameKey)) return;
      write(COUNTED_KEY, [...seen, gameKey].slice(-COUNTED_LIMIT));
    }
    addResult(gameId, opponent, winners.length === 0 ? "draws" : winners.includes(you) ? "wins" : "losses");
    // Only the end of the game matters, not each new array of winners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, opponent, you, gameId, gameKey]);
}
