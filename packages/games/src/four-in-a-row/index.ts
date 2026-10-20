import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type FourEvent, type FourMove, type FourState } from "./rules";

export * from "./rules";
export { BOT_LEVELS, bestMoves, chooseMove } from "./bot";

export const fourInARow: Game<FourState, FourMove, FourEvent> = {
  id: "four-in-a-row",
  name: "Four in a Row",
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
