import type { BotLevel, Seat } from "@laro/games";

export type SungkaMode = "bot" | "local";
export type FirstPlayer = "me" | "them" | "random";

export interface SungkaSettings {
  mode: SungkaMode;
  level: BotLevel;
  first: FirstPlayer;
}

export const DEFAULT_SETTINGS: SungkaSettings = { mode: "bot", level: "medium", first: "me" };

export const LEVEL_LABELS: Record<BotLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Seat 0 sits at the bottom of the screen, seat 1 at the top. */
export function seatNames(mode: SungkaMode): [string, string] {
  return mode === "bot" ? ["You", "Bot"] : ["Player 1", "Player 2"];
}

export function firstSeatFor(first: FirstPlayer): Seat {
  if (first === "me") return 0;
  if (first === "them") return 1;
  return Math.random() < 0.5 ? 0 : 1;
}
