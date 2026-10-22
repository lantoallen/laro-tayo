import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  legalMoves,
  play,
  result,
  setup,
  view,
  type MemoryEvent,
  type MemoryMove,
  type MemoryState,
} from "./rules";

export * from "./rules";
export { REMEMBERS, chooseMove } from "./bot";

export const memory: Game<MemoryState, MemoryMove, MemoryEvent> = {
  id: "memory",
  name: "Memory",
  minSeats: MIN_PLAYERS,
  maxSeats: MAX_PLAYERS,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Everyone sees the same table: the cards that are face up, and nothing else.
  view: (state) => view(state),
  result,
  bot: chooseMove,
};
