import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type DotsEvent, type DotsMove, type DotsState } from "./rules";

export * from "./rules";
export { chooseMove } from "./bot";

export const dotsAndBoxes: Game<DotsState, DotsMove, DotsEvent> = {
  id: "dots-and-boxes",
  name: "Dots and Boxes",
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
