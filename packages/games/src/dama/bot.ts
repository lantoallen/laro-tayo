import { pick } from "../engine/rng";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import {
  SIZE,
  SQUARES,
  applyMove,
  colOf,
  fullMoves,
  isKing,
  ownerOf,
  rowOf,
  type DamaMove,
  type DamaState,
  type FullMove,
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
  easy: { depth: 1, randomChance: 0.4 },
  medium: { depth: 3, randomChance: 0.1 },
  hard: { depth: 12, timeLimitMs: 350, randomChance: 0 },
};

const MAN = 100;
const KING = 320;
/** More than any material difference, so a won game always beats a good-looking position. */
const WIN = 100_000;

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
  moves: DamaMove[];
  score: number;
  /** The deepest search that finished. */
  depth: number;
}

/**
 * Scores a position from `me`'s side: material first, then men that have
 * moved up the board and pieces near the middle, which have more room.
 */
function evaluate(state: DamaState, me: Seat): number {
  if (state.turn === null) {
    if (state.winner === null) return 0;
    return state.winner === me ? WIN - state.turns : -WIN + state.turns;
  }
  let score = 0;
  for (let square = 0; square < SQUARES; square++) {
    const piece = state.board[square];
    const owner = ownerOf(piece);
    if (owner === null) continue;
    let value = isKing(piece) ? KING : MAN;
    if (!isKing(piece)) {
      const advanced = owner === 0 ? SIZE - 1 - rowOf(square) : rowOf(square);
      value += advanced * 3;
    }
    const col = colOf(square);
    if (col >= 2 && col <= 5) value += 4;
    score += owner === me ? value : -value;
  }
  return score;
}

interface Child {
  move: FullMove;
  state: DamaState;
}

/** Every position one move from here, best-looking first for whoever is moving, so pruning cuts more. */
function children(state: DamaState, turn: Seat): Child[] {
  return fullMoves(state.board, turn)
    .map((move) => ({ move, state: applyMove(state, turn, move) }))
    .sort((a, b) => evaluate(b.state, turn) - evaluate(a.state, turn));
}

/** Minimax with alpha-beta pruning. */
function search(state: DamaState, me: Seat, depth: number, alpha: number, beta: number, clock: Clock): number {
  if (state.turn === null || depth === 0) return evaluate(state, me);
  if (++clock.nodes % 512 === 0 && clock.now() > clock.deadline) throw new OutOfTime();

  const maximizing = state.turn === me;
  let best = maximizing ? -Infinity : Infinity;
  for (const child of children(state, state.turn)) {
    const score = search(child.state, me, depth - 1, alpha, beta, clock);
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
export function searchBestMoves(state: DamaState, seat: Seat, options: SearchOptions): SearchResult {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  const roots = children(state, seat);
  if (roots.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);

  let found: SearchResult = { moves: roots.map((child) => child.move.path), score: 0, depth: 0 };
  if (roots.length === 1) return found;

  const now = options.now ?? Date.now;
  const clock: Clock = {
    deadline: options.timeLimitMs === undefined ? Infinity : now() + options.timeLimitMs,
    now,
    nodes: 0,
  };

  for (let depth = 1; depth <= options.depth; depth++) {
    try {
      let bestScore = -Infinity;
      let bestMoves: DamaMove[] = [];
      for (const child of roots) {
        // Each first move gets a full window so ties are exact and the bot can choose between them.
        const score = search(child.state, seat, depth - 1, -Infinity, Infinity, clock);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [child.move.path];
        } else if (score === bestScore) {
          bestMoves.push(child.move.path);
        }
      }
      found = { moves: bestMoves, score: bestScore, depth };
      if (Math.abs(bestScore) >= WIN / 2) break;
    } catch (error) {
      if (error instanceof OutOfTime) break;
      throw error;
    }
  }
  return found;
}

export function chooseMove(state: DamaState, seat: Seat, { level, rng }: BotOptions): DamaMove {
  const config = BOT_LEVELS[level];
  const legal = fullMoves(state.board, seat);
  if (state.turn !== seat || legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  if (rng() < config.randomChance) return pick(rng, legal).path;
  return pick(rng, searchBestMoves(state, seat, config).moves);
}
