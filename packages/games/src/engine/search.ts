import { IllegalMoveError, type Seat } from "./types";

/** What a minimax search needs to know about a game. */
export interface SearchGame<State, Move> {
  /** Whose turn it is, or null once the game is over. */
  turn(state: State): Seat | null;
  /** Every move from here and the position it leads to, best-looking first so pruning cuts more. */
  children(state: State, seat: Seat): { move: Move; state: State }[];
  /** Scores a position from `me`'s side. A finished game should score WIN or more away from 0. */
  evaluate(state: State, me: Seat): number;
}

export interface SearchOptions {
  /** How many moves ahead to look. */
  depth: number;
  /** Stop searching deeper after this long and use the deepest finished answer. */
  timeLimitMs?: number;
  /** Lets tests control time. */
  now?: () => number;
}

export interface SearchResult<Move> {
  /** Every move tied for the best score. */
  moves: Move[];
  score: number;
  /** The deepest search that finished. */
  depth: number;
}

/** More than any position can be worth, so a won game always beats a good-looking one. */
export const WIN = 100_000;

class OutOfTime extends Error {}

interface Clock {
  deadline: number;
  now: () => number;
  nodes: number;
}

/** Minimax with alpha-beta pruning. A player who moves twice in a row is handled by asking whose turn it is. */
function search<State, Move>(
  game: SearchGame<State, Move>,
  state: State,
  me: Seat,
  depth: number,
  alpha: number,
  beta: number,
  clock: Clock,
): number {
  const turn = game.turn(state);
  if (turn === null || depth === 0) return game.evaluate(state, me);
  if (++clock.nodes % 512 === 0 && clock.now() > clock.deadline) throw new OutOfTime();

  const maximizing = turn === me;
  let best = maximizing ? -Infinity : Infinity;
  for (const child of game.children(state, turn)) {
    const score = search(game, child.state, me, depth - 1, alpha, beta, clock);
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
export function searchBestMoves<State, Move>(
  game: SearchGame<State, Move>,
  state: State,
  seat: Seat,
  options: SearchOptions,
): SearchResult<Move> {
  if (game.turn(state) !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  const roots = game.children(state, seat);
  if (roots.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);

  let found: SearchResult<Move> = { moves: roots.map((child) => child.move), score: 0, depth: 0 };
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
      let bestMoves: Move[] = [];
      for (const child of roots) {
        // Each first move gets a full window so ties are exact and the bot can choose between them.
        const score = search(game, child.state, seat, depth - 1, -Infinity, Infinity, clock);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [child.move];
        } else if (score === bestScore) {
          bestMoves.push(child.move);
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
