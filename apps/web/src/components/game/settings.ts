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
