import type { Game } from "@laro/games";
import { sungka } from "@laro/games/sungka";

/** Rooms only pass a game's state around, and each game checks its own types. */
export type AnyGame = Game<any, any, any, any>;

/** Every game that can be played in an online room. */
export const GAMES = { sungka } satisfies Record<string, AnyGame>;

export type GameId = keyof typeof GAMES;

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && Object.hasOwn(GAMES, value);
}

export function gameFor(id: GameId): AnyGame {
  return GAMES[id];
}
