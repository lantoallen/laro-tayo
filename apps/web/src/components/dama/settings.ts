import type { BotLevel } from "@laro/games";
import type { FirstPlayer } from "@/components/game/settings";

export type DamaMode = "bot" | "local" | "online";

export interface DamaSettings {
  mode: DamaMode;
  level: BotLevel;
  first: FirstPlayer;
}

export const DEFAULT_SETTINGS: DamaSettings = { mode: "bot", level: "medium", first: "me" };

/** Seat 0 plays red from the bottom, seat 1 plays blue from the top. */
export function seatNames(mode: DamaMode): [string, string] {
  return mode === "bot" ? ["You", "Bot"] : ["Red", "Blue"];
}
