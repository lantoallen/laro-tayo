import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, view, type PigEvent, type PigMove, type PigState } from "./rules";

export * from "./rules";
export { chooseMove } from "./bot";

export const pig: Game<PigState, PigMove, PigEvent> = {
  id: "pig",
  name: "Pig",
  minSeats: 2,
  maxSeats: 2,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  view: (state) => view(state),
  result,
  bot: chooseMove,
};
