import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type ReversiEvent, type ReversiMove, type ReversiState } from "./rules";

export * from "./rules";
export { BOT_LEVELS, bestMoves, chooseMove } from "./bot";

export const reversi: Game<ReversiState, ReversiMove, ReversiEvent> = {
  id: "reversi",
  name: "Reversi",
  minSeats: 2,
  maxSeats: 2,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Nothing is hidden, so every seat sees the whole board.
  view: (state) => state,
  result,
  bot: chooseMove,
};
