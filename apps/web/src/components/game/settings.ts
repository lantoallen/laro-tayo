import type { BotLevel, Seat } from "@laro/games";

export type FirstPlayer = "me" | "them" | "random";

export const LEVEL_LABELS: Record<BotLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

/** Seat 0 is the player at the bottom of the screen. "Random" picks any of the `players` seats. */
export function firstSeatFor(first: FirstPlayer, players = 2): Seat {
  if (first === "me") return 0;
  if (first === "them") return 1;
  return Math.floor(Math.random() * players);
}

export type PlayMode = "bot" | "local" | "online";

/** The setup choices for a board game. */
export interface BoardGameSettings {
  mode: PlayMode;
  level: BotLevel;
  first: FirstPlayer;
  /** How many are playing, counting you and any bots. */
  players: number;
}

export const DEFAULT_BOARD_GAME: BoardGameSettings = { mode: "bot", level: "medium", first: "me", players: 2 };

/** You always sit in seat 0, at the bottom. In a bot game every other seat is a bot. */
export const YOU: Seat = 0;

/** What a bot is called: just "Bot" when it's the only one, or "Bot 2" for seat 2. */
export const botName = (seat: Seat, players: number) => (players === 2 ? "Bot" : `Bot ${seat}`);

/** The colors players play as, matching the pieces on the boards. */
export const SEAT_COLORS = {
  red: "#ce1126",
  blue: "#0038a8",
  yellow: "#fcd116",
  black: "#1b1b1b",
  white: "#fffaf0",
  green: "#2f9e44",
} as const;

/** Colors for games of up to four, in seat order. */
export const FOUR_COLORS = ["Red", "Blue", "Yellow", "Green"] as const;
export const FOUR_SWATCHES = [SEAT_COLORS.red, SEAT_COLORS.blue, SEAT_COLORS.yellow, SEAT_COLORS.green] as const;
