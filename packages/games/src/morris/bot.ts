import { pick } from "../engine/rng";
import { WIN, searchBestMoves, type SearchGame, type SearchOptions } from "../engine/search";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import { MILLS, legalMoves, movesFor, otherSeat, piecesLeft, play, type MorrisMove, type MorrisState } from "./rules";

interface LevelConfig extends SearchOptions {
  /** Chance of playing a random move instead, so easier bots make mistakes. */
  randomChance: number;
}

export const BOT_LEVELS: Record<BotLevel, LevelConfig> = {
  easy: { depth: 1, randomChance: 0.3 },
  medium: { depth: 3, randomChance: 0.05 },
  hard: { depth: 12, timeLimitMs: 400, randomChance: 0 },
};

/**
 * Scores a position from `me`'s side: pieces first, then mills, lines of two
 * that could become a mill, and how free each side's pieces are to move.
 */
function evaluate(state: MorrisState, me: Seat): number {
  if (state.turn === null) {
    if (state.winner === null) return 0;
    return state.winner === me ? WIN - state.turns : -WIN + state.turns;
  }
  const them = otherSeat(me);
  let score = 100 * (piecesLeft(state, me) - piecesLeft(state, them));
  for (const mill of MILLS) {
    let mine = 0;
    let theirs = 0;
    for (const point of mill) {
      if (state.board[point] === me) mine++;
      else if (state.board[point] === them) theirs++;
    }
    if (mine === 3) score += 8;
    else if (theirs === 3) score -= 8;
    else if (mine === 2 && theirs === 0) score += 12;
    else if (theirs === 2 && mine === 0) score -= 12;
  }
  if (state.inHand[0] === 0 && state.inHand[1] === 0) {
    score += 3 * (movesFor(state, me).length - movesFor(state, them).length);
  }
  // Whoever made a mill is about to take a piece.
  if (state.taking) score += state.turn === me ? 90 : -90;
  return score;
}

const SEARCH: SearchGame<MorrisState, MorrisMove> = {
  turn: (state) => state.turn,
  children: (state, seat) =>
    legalMoves(state, seat)
      .map((move) => ({ move, state: play(state, seat, move).state }))
      .sort((a, b) => evaluate(b.state, seat) - evaluate(a.state, seat)),
  evaluate,
};

/** The best moves for `seat`, for tests and anything else that wants more than one answer. */
export function bestMoves(state: MorrisState, seat: Seat, options: SearchOptions) {
  return searchBestMoves(SEARCH, state, seat, options);
}

export function chooseMove(state: MorrisState, seat: Seat, { level, rng }: BotOptions): MorrisMove {
  const config = BOT_LEVELS[level];
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  if (rng() < config.randomChance) return pick(rng, legal);
  return pick(rng, searchBestMoves(SEARCH, state, seat, config).moves);
}
