import { pick } from "../engine/rng";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import {
  TOTAL_SHELLS,
  housesOf,
  legalMoves,
  nextTurn,
  otherSeat,
  sow,
  storeOf,
  type SungkaMove,
  type SungkaState,
} from "./rules";

interface LevelConfig {
  /** How many moves ahead to look. */
  depth: number;
  /** Stop searching deeper after this long and use the deepest finished answer. */
  timeLimitMs?: number;
  /** Chance of playing a random move instead, so easier bots make mistakes. */
  randomChance: number;
}

export const BOT_LEVELS: Record<BotLevel, LevelConfig> = {
  easy: { depth: 1, randomChance: 0.5 },
  medium: { depth: 3, randomChance: 0.1 },
  hard: { depth: 14, timeLimitMs: 350, randomChance: 0 },
};

/** Bigger than any possible store difference, so a won game always beats a good-looking position. */
const WIN = 1000;

class OutOfTime extends Error {}

interface Clock {
  deadline: number;
  now: () => number;
  nodes: number;
}

export interface SearchOptions {
  depth: number;
  timeLimitMs?: number;
  /** Lets tests control time. */
  now?: () => number;
}

export interface SearchResult {
  /** Every move tied for the best score. */
  moves: SungkaMove[];
  score: number;
  /** The deepest search that finished. */
  depth: number;
}

function storeLead(board: readonly number[], me: Seat): number {
  return board[storeOf(me)] - board[storeOf(otherSeat(me))];
}

/** Scores a board from `me`'s side. Stores only grow, so more than half the shells is a guaranteed win. */
function evaluate(board: readonly number[], turn: Seat | null, me: Seat): number | null {
  const lead = storeLead(board, me);
  const half = TOTAL_SHELLS / 2;
  if (board[storeOf(me)] > half) return WIN + lead;
  if (board[storeOf(otherSeat(me))] > half) return -WIN + lead;
  if (turn === null) return lead === 0 ? 0 : (lead > 0 ? WIN : -WIN) + lead;
  return null;
}

interface Child {
  move: SungkaMove;
  board: number[];
  turn: Seat | null;
}

/** Every position one move from here, best-looking first for whoever is moving, so pruning cuts more. */
function children(board: readonly number[], turn: Seat): Child[] {
  const list: Child[] = [];
  for (const house of housesOf(turn)) {
    if (board[house] === 0) continue;
    const next = board.slice();
    const endedInStore = sow(next, turn, house);
    list.push({ move: house, board: next, turn: nextTurn(next, turn, endedInStore) });
  }
  return list.sort((a, b) => storeLead(b.board, turn) - storeLead(a.board, turn));
}

/** Minimax with alpha-beta pruning. A bonus turn means the same player moves again. */
function search(
  board: readonly number[],
  turn: Seat | null,
  me: Seat,
  depth: number,
  alpha: number,
  beta: number,
  clock: Clock,
): number {
  const settled = evaluate(board, turn, me);
  if (settled !== null) return settled;
  if (depth === 0 || turn === null) return storeLead(board, me);

  if (++clock.nodes % 512 === 0 && clock.now() > clock.deadline) throw new OutOfTime();

  const maximizing = turn === me;
  let best = maximizing ? -Infinity : Infinity;
  for (const child of children(board, turn)) {
    const score = search(child.board, child.turn, me, depth - 1, alpha, beta, clock);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Looks one move deeper at a time until it reaches `depth` or runs out of time,
 * and returns the best moves from the deepest search that finished.
 */
export function searchBestMoves(state: SungkaState, seat: Seat, options: SearchOptions): SearchResult {
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);

  let found: SearchResult = { moves: legal, score: 0, depth: 0 };
  if (legal.length === 1) return found;

  const now = options.now ?? Date.now;
  const clock: Clock = {
    deadline: options.timeLimitMs === undefined ? Infinity : now() + options.timeLimitMs,
    now,
    nodes: 0,
  };

  for (let depth = 1; depth <= options.depth; depth++) {
    try {
      let bestScore = -Infinity;
      let bestMoves: SungkaMove[] = [];
      for (const child of children(state.board, seat)) {
        // Each root move gets a full window so ties are exact and the bot can choose between them.
        const score = search(child.board, child.turn, seat, depth - 1, -Infinity, Infinity, clock);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [child.move];
        } else if (score === bestScore) {
          bestMoves.push(child.move);
        }
      }
      found = { moves: bestMoves.sort((a, b) => a - b), score: bestScore, depth };
      if (Math.abs(bestScore) >= WIN) break;
    } catch (error) {
      if (error instanceof OutOfTime) break;
      throw error;
    }
  }
  return found;
}

export function chooseMove(state: SungkaState, seat: Seat, { level, rng }: BotOptions): SungkaMove {
  const config = BOT_LEVELS[level];
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  if (rng() < config.randomChance) return pick(rng, legal);
  return pick(rng, searchBestMoves(state, seat, config).moves);
}
