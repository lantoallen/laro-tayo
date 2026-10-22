import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type TicTacToeEvent, type TicTacToeMove, type TicTacToeState } from "./rules";

export * from "./rules";
export { BOT_LEVELS, bestMoves, chooseMove } from "./bot";

export const ticTacToe: Game<TicTacToeState, TicTacToeMove, TicTacToeEvent> = {
  id: "tic-tac-toe",
  name: "Tic-Tac-Toe",
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
