import type { Game } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, view, type SeaEvent, type SeaMove, type SeaState } from "./rules";

export * from "./rules";
export { chooseMove } from "./bot";

export const seaBattle: Game<SeaState, SeaMove, SeaEvent> = {
  id: "sea-battle",
  name: "Sea Battle",
  minSeats: 2,
  maxSeats: 2,
  setup,
  turn: (state) => state.turn,
  legalMoves,
  play,
  // Each player sees their own ships and only the ships of the other fleet that they've sunk.
  view,
  result,
  bot: chooseMove,
};
