import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  legalMoves,
  play,
  result,
  setup,
  type TilesEvent,
  type TilesMove,
  type TilesState,
} from "./rules";

export * from "./rules";
export { chooseMove, room } from "./bot";

export const sinkingTiles: Game<TilesState, TilesMove, TilesEvent> = {
  id: "sinking-tiles",
  name: "Sinking Tiles",
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
