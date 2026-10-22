import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import { GOAL, legalMoves, otherSeat, type PigMove, type PigState } from "./rules";

/**
 * When to stop rolling and bank the points:
 *
 * - Easy banks after 10 points, and now and then on a whim.
 * - Medium banks after 20, the classic rule of thumb.
 * - Hard banks after about 20 too, but takes more risks when behind, plays it
 *   safe when ahead, and keeps rolling when the other player is close to winning.
 */
function holdAt(state: PigState, seat: Seat, level: BotLevel): number {
  if (level === "easy") return 10;
  if (level === "medium") return 20;
  const mine = state.scores[seat];
  const theirs = state.scores[otherSeat(seat)];
  if (theirs >= GOAL - 15) return GOAL - mine;
  return Math.max(12, Math.min(GOAL - mine, 21 + Math.round((theirs - mine) / 8)));
}

export function chooseMove(state: PigState, seat: Seat, { level, rng }: BotOptions): PigMove {
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  if (!legal.includes("hold")) return "roll";
  if (level === "easy" && rng() < 0.15) return "hold";
  return state.turnTotal >= holdAt(state, seat, level) ? "hold" : "roll";
}
