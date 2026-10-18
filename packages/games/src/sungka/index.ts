import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type SungkaEvent, type SungkaMove, type SungkaState } from "./rules";

export * from "./rules";
export { BOT_LEVELS, chooseMove, searchBestMoves, type SearchOptions, type SearchResult } from "./bot";

export const sungka: Game<SungkaState, SungkaMove, SungkaEvent> = {
  id: "sungka",
  name: "Sungka",
  minSeats: 2,
  maxSeats: 2,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Nothing is hidden in Sungka, so every seat sees the whole board.
  view: (state) => state,
  result,
  bot: chooseMove,
};
