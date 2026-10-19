import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import {
  SEATS,
  legalMoves,
  play,
  result,
  setup,
  viewFor,
  type PusoyEvent,
  type PusoyMove,
  type PusoyState,
  type PusoyView,
} from "./rules";

export * from "./cards";
export * from "./rules";
export { chooseMove, chooseMoveFromView } from "./bot";

export const pusoyDos: Game<PusoyState, PusoyMove, PusoyEvent, PusoyView> = {
  id: "pusoy-dos",
  name: "Pusoy Dos",
  minSeats: SEATS,
  maxSeats: SEATS,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Each seat sees its own hand and only how many cards everyone else holds.
  view: viewFor,
  result,
  bot: chooseMove,
};
