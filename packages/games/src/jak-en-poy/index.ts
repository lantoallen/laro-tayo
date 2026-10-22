import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, view, type JakEvent, type JakMove, type JakState } from "./rules";

export * from "./rules";
export { chooseMove } from "./bot";

export const jakEnPoy: Game<JakState, JakMove, JakEvent> = {
  id: "jak-en-poy",
  name: "Jak-en-poy",
  minSeats: 2,
  maxSeats: 2,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Each player sees their own pick, but not the other's until the round is decided.
  view,
  result,
  bot: chooseMove,
};
