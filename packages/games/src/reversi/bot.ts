import { pick } from "../engine/rng";
import { WIN, searchBestMoves, type SearchGame, type SearchOptions } from "../engine/search";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import {
  SIZE,
  SQUARES,
  countDiscs,
  legalMoves,
  movesFor,
  otherSeat,
  play,
  type ReversiMove,
  type ReversiState,
} from "./rules";

interface LevelConfig extends SearchOptions {
  /** Chance of playing a random move instead, so easier bots make mistakes. */
  randomChance: number;
}

export const BOT_LEVELS: Record<BotLevel, LevelConfig> = {
  easy: { depth: 1, randomChance: 0.3 },
  medium: { depth: 3, randomChance: 0.05 },
  hard: { depth: 14, timeLimitMs: 400, randomChance: 0 },
};

/**
 * How good each square is to hold. Corners can never be flipped back, and the
 * squares next to an empty corner are risky because they give it away.
 */
const WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
].flat();

/** Each corner and the three squares next to it. */
const CORNERS: [number, number[]][] = [
  [0, [1, SIZE, SIZE + 1]],
  [SIZE - 1, [SIZE - 2, 2 * SIZE - 1, 2 * SIZE - 2]],
  [SQUARES - SIZE, [SQUARES - 2 * SIZE, SQUARES - SIZE + 1, SQUARES - 2 * SIZE + 1]],
  [SQUARES - 1, [SQUARES - 2, SQUARES - SIZE - 1, SQUARES - SIZE - 2]],
];

/** Scores a position from `me`'s side: where the discs are, and how many moves each player has. */
function evaluate(state: ReversiState, me: Seat): number {
  const { board } = state;
  if (state.turn === null) {
    const difference = countDiscs(board, me) - countDiscs(board, otherSeat(me));
    return difference === 0 ? 0 : Math.sign(difference) * WIN + difference;
  }
  let score = 0;
  for (let square = 0; square < SQUARES; square++) {
    const disc = board[square];
    if (disc !== null) score += disc === me ? WEIGHTS[square] : -WEIGHTS[square];
  }
  // Once a corner is taken, the squares next to it are no longer a risk.
  for (const [corner, next] of CORNERS) {
    if (board[corner] === null) continue;
    for (const square of next) {
      const disc = board[square];
      if (disc !== null) score -= disc === me ? WEIGHTS[square] : -WEIGHTS[square];
    }
  }
  score += 5 * (movesFor(board, me).length - movesFor(board, otherSeat(me)).length);
  return score;
}

const SEARCH: SearchGame<ReversiState, ReversiMove> = {
  turn: (state) => state.turn,
  children: (state, seat) =>
    movesFor(state.board, seat)
      .sort((a, b) => WEIGHTS[b] - WEIGHTS[a])
      .map((square) => ({ move: square, state: play(state, seat, square).state })),
  evaluate,
};

/** The best moves for `seat`, for tests and anything else that wants more than one answer. */
export function bestMoves(state: ReversiState, seat: Seat, options: SearchOptions) {
  return searchBestMoves(SEARCH, state, seat, options);
}

export function chooseMove(state: ReversiState, seat: Seat, { level, rng }: BotOptions): ReversiMove {
  const config = BOT_LEVELS[level];
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  if (rng() < config.randomChance) return pick(rng, legal);
  return pick(rng, searchBestMoves(SEARCH, state, seat, config).moves);
}
