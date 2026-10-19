import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type DamaEvent, type DamaMove, type DamaState } from "./rules";

export * from "./rules";
export { BOT_LEVELS, chooseMove, searchBestMoves, type SearchOptions, type SearchResult } from "./bot";

export const dama: Game<DamaState, DamaMove, DamaEvent> = {
  id: "dama",
  name: "Dama",
  minSeats: 2,
  maxSeats: 2,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Nothing is hidden in Dama, so every seat sees the whole board.
  view: (state) => state,
  result,
  bot: chooseMove,
};
