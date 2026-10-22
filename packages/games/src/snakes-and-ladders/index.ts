import type { Game } from "../engine/types";
import { legalMoves, play, result, setup, type SnakesEvent, type SnakesMove, type SnakesState } from "./rules";

export * from "./rules";

export const snakesAndLadders: Game<SnakesState, SnakesMove, SnakesEvent> = {
  id: "snakes-and-ladders",
  name: "Snakes and Ladders",
  minSeats: 2,
  maxSeats: 2,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Every roll is up to the die, so there's nothing to hide.
  view: (state) => state,
  result,
  // There's nothing to decide, only the die to roll.
  bot: () => "roll",
};
