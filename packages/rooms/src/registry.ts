import type { Game } from "@laro/games";
import { dama } from "@laro/games/dama";
import { dotsAndBoxes } from "@laro/games/dots-and-boxes";
import { fourInARow } from "@laro/games/four-in-a-row";
import { jakEnPoy } from "@laro/games/jak-en-poy";
import { memory } from "@laro/games/memory";
import { morris } from "@laro/games/morris";
import { pig } from "@laro/games/pig";
import { reversi } from "@laro/games/reversi";
import { seaBattle } from "@laro/games/sea-battle";
import { snakesAndLadders } from "@laro/games/snakes-and-ladders";
import { sungka } from "@laro/games/sungka";
import { ticTacToe } from "@laro/games/tic-tac-toe";

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
  "tic-tac-toe": ticTacToe,
  "snakes-and-ladders": snakesAndLadders,
  pig,
  "jak-en-poy": jakEnPoy,
} satisfies Record<string, AnyGame>;

export type GameId = keyof typeof GAMES;

export function isGameId(value: unknown): value is GameId {
  return typeof value === "string" && Object.hasOwn(GAMES, value);
}

export function gameFor(id: GameId): AnyGame {
  return GAMES[id];
}
