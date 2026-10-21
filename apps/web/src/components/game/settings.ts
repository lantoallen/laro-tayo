import type { BotLevel, Seat } from "@laro/games";

export type FirstPlayer = "me" | "them" | "random";

export const LEVEL_LABELS: Record<BotLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Seat 0 is the player at the bottom of the screen. */
export function firstSeatFor(first: FirstPlayer): Seat {
  if (first === "me") return 0;
  if (first === "them") return 1;
  return Math.random() < 0.5 ? 0 : 1;
}

export type PlayMode = "bot" | "local" | "online";

/** The setup choices for a two-player game. */
export interface TwoPlayerSettings {
  mode: PlayMode;
  level: BotLevel;
  first: FirstPlayer;
}

export const DEFAULT_TWO_PLAYER: TwoPlayerSettings = { mode: "bot", level: "medium", first: "me" };

/** The bot always sits at the top, in seat 1. */
export const BOT_SEAT: Seat = 1;

/** The colors players play as, matching the pieces on the boards. */
export const SEAT_COLORS = {
  red: "#ce1126",
  blue: "#0038a8",
  yellow: "#fcd116",
  black: "#1b1b1b",
  white: "#fffaf0",
} as const;
