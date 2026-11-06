import { pick } from "../engine/rng";
import { IllegalMoveError, type BotOptions, type Seat } from "../engine/types";
import { legalMoves, type NimMove, type NimState } from "./rules";

/** The XOR of all the pile sizes. A player who leaves it at zero can always keep it there, and wins. */
export const nimSum = (piles: readonly number[]) => piles.reduce((sum, size) => sum ^ size, 0);

/** A move that leaves the nim-sum at zero, or null when there isn't one (the player is losing against perfect play). */
export function winningMove(state: NimState): NimMove | null {
  const sum = nimSum(state.piles);
  if (sum === 0) return null;
  for (let pile = 0; pile < state.piles.length; pile++) {
    const target = state.piles[pile] ^ sum;
    if (target < state.piles[pile]) return { pile, count: state.piles[pile] - target };
  }
  return null;
}

/** When there's no winning move, take one stick from the biggest pile, which keeps the game going longest. */
function stall(state: NimState): NimMove {
  const pile = state.piles.indexOf(Math.max(...state.piles));
  return { pile, count: 1 };
}

/**
 * - Easy picks at random, and now and then spots the winning move.
 * - Medium plays the winning move about two times in three.
 * - Hard always plays it. It can only be beaten by someone who has the winning move on every turn.
 */
export function chooseMove(state: NimState, seat: Seat, { level, rng }: BotOptions): NimMove {
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  const chance = level === "hard" ? 1 : level === "medium" ? 0.65 : 0.15;
  if (rng() < chance) return winningMove(state) ?? stall(state);
  return pick(rng, legal);
}
