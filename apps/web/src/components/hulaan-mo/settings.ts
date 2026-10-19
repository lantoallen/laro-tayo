import type { HulaanSettings } from "@laro/games/hulaan-mo";

export const DEFAULT_SETTINGS: HulaanSettings = { teams: 2, seconds: 90, rounds: 2, pack: "mixed" };

/** Each team plays under one of the flag colors. */
export const TEAM_CLASSES = ["bg-blue text-blue-ink", "bg-red text-red-ink", "bg-yellow text-yellow-ink", "bg-ink text-bg"];

export const teamName = (team: number) => `Team ${team + 1}`;
