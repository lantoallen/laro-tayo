import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  legalMoves,
  play,
  result,
  setup,
  type DotsEvent,
  type DotsMove,
  type DotsState,
} from "./rules";

export * from "./rules";
export { chooseMove } from "./bot";

export const dotsAndBoxes: Game<DotsState, DotsMove, DotsEvent> = {
  id: "dots-and-boxes",
  name: "Dots and Boxes",
  minSeats: MIN_PLAYERS,
  maxSeats: MAX_PLAYERS,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Nothing is hidden, so every seat sees the whole board.
  view: (state) => state,
  result,
  bot: chooseMove,
};
