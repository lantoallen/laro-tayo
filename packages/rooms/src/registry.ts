import type { Game } from "@laro/games";
import { dama } from "@laro/games/dama";
import { dotsAndBoxes } from "@laro/games/dots-and-boxes";
import { fourInARow } from "@laro/games/four-in-a-row";
import { memory } from "@laro/games/memory";
import { morris } from "@laro/games/morris";
import { reversi } from "@laro/games/reversi";
import { seaBattle } from "@laro/games/sea-battle";
import { sungka } from "@laro/games/sungka";

/** Rooms only pass a game's state around, and each game checks its own types. */
export type AnyGame = Game<any, any, any, any>;

/** Every game that can be played in an online room. */
export const GAMES = {
  sungka,
  dama,
  "four-in-a-row": fourInARow,
  reversi,
  "dots-and-boxes": dotsAndBoxes,
  memory,
  morris,
  "sea-battle": seaBattle,
} satisfies Record<string, AnyGame>;

export type GameId = keyof typeof GAMES;

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && Object.hasOwn(GAMES, value);
}

export function gameFor(id: GameId): AnyGame {
  return GAMES[id];
}
