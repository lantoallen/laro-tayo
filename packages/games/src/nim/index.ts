import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import {
  PLAYERS,
  legalMoves,
  play,
  result,
  setup,
  view,
  type NimEvent,
  type NimMove,
  type NimState,
} from "./rules";

export * from "./rules";
export { chooseMove, nimSum, winningMove } from "./bot";

export const nim: Game<NimState, NimMove, NimEvent> = {
  id: "nim",
  name: "Nim",
  minSeats: PLAYERS,
  maxSeats: PLAYERS,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  view: (state) => view(state),
  result,
  bot: chooseMove,
};
