import type { BotLevel } from "@laro/games";
import type { FirstPlayer } from "@/components/game/settings";

export { firstSeatFor, LEVEL_LABELS, type FirstPlayer } from "@/components/game/settings";

export type SungkaMode = "bot" | "local" | "online";
export interface SungkaSettings {
  mode: SungkaMode;
  level: BotLevel;
  first: FirstPlayer;
}

export const DEFAULT_SETTINGS: SungkaSettings = { mode: "bot", level: "medium", first: "me" };

/** Seat 0 sits at the bottom of the screen, seat 1 at the top. */
export function seatNames(mode: SungkaMode): [string, string] {
  return mode === "bot" ? ["You", "Bot"] : ["Player 1", "Player 2"];
}
