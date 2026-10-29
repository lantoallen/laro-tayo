import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_MS,
  legalMoves,
  movers,
  play,
  result,
  setup,
  timeOut,
  view,
  type TilesEvent,
  type TilesMove,
  type TilesState,
} from "./rules";

export * from "./rules";
export { chooseMove, room } from "./bot";

/** Players take turns stepping. */
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

/** Everyone picks a tile in secret, then all the pieces move at once. */
export const sinkingTilesTogether: Game<TilesState, TilesMove, TilesEvent> = {
  id: "sinking-tiles-together",
  name: "Sinking Tiles",
  minSeats: MIN_PLAYERS,
  maxSeats: MAX_PLAYERS,
  setup: (options) => setup({ ...options, mode: "together" }),
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Each player sees their own pick, but nobody else's until the round is played.
  view,
  result,
  bot: chooseMove,
  movers,
  timer: { ms: ROUND_MS, round: (state) => state.round, timeOut },
};
