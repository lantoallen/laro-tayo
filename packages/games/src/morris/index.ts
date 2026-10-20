import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type MorrisEvent, type MorrisMove, type MorrisState } from "./rules";

export * from "./rules";
export { BOT_LEVELS, bestMoves, chooseMove } from "./bot";

export const morris: Game<MorrisState, MorrisMove, MorrisEvent> = {
  id: "morris",
  name: "Nine Men's Morris",
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
