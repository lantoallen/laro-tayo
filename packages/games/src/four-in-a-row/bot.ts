import { pick } from "../engine/rng";
import { WIN, searchBestMoves, type SearchGame, type SearchOptions } from "../engine/search";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import { COLUMNS, ROWS, landingCell, legalMoves, play, type FourMove, type FourState } from "./rules";

interface LevelConfig extends SearchOptions {
  /** Chance of playing a random move instead, so easier bots make mistakes. */
  randomChance: number;
}

/** Easy only sees its own wins. Medium blocks yours and looks a few moves ahead. Hard looks ahead for 0.4 s. */
export const BOT_LEVELS: Record<BotLevel, LevelConfig> = {
  easy: { depth: 1, randomChance: 0.25 },
  medium: { depth: 4, randomChance: 0.05 },
  hard: { depth: 16, timeLimitMs: 400, randomChance: 0 },
};

/** Every line of four cells on the board. */
const WINDOWS: number[][] = [];
for (let row = 0; row < ROWS; row++) {
  for (let col = 0; col < COLUMNS; col++) {
    for (const [dr, dc] of [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]) {
      const endRow = row + dr * 3;
      const endCol = col + dc * 3;
      if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLUMNS) continue;
      WINDOWS.push([0, 1, 2, 3].map((i) => (row + dr * i) * COLUMNS + col + dc * i));
    }
  }
}

/** What a line of four is worth with 0 to 3 of one player's discs and none of the other's. */
const WINDOW_VALUE = [0, 1, 8, 50];
const CENTER = Math.floor(COLUMNS / 2);
/** Middle columns first: they're usually the better moves, so the search can skip more. */
const COLUMN_ORDER = [3, 2, 4, 1, 5, 0, 6];

/** Scores a position from `me`'s side by counting the lines each player could still finish. */
function evaluate(state: FourState, me: Seat): number {
  if (state.turn === null) {
    if (state.winner === null) return 0;
    // Faster wins and slower losses score better.
    return state.winner === me ? WIN - state.turns : -WIN + state.turns;
  }
  let score = 0;
  for (const window of WINDOWS) {
    let mine = 0;
    let theirs = 0;
    for (const cell of window) {
      const disc = state.board[cell];
      if (disc === me) mine++;
      else if (disc !== null) theirs++;
    }
    if (mine === 0) score -= WINDOW_VALUE[theirs];
    else if (theirs === 0) score += WINDOW_VALUE[mine];
  }
  for (let row = 0; row < ROWS; row++) {
    const disc = state.board[row * COLUMNS + CENTER];
    if (disc !== null) score += disc === me ? 3 : -3;
  }
  return score;
}

const SEARCH: SearchGame<FourState, FourMove> = {
  turn: (state) => state.turn,
  children: (state, seat) =>
    COLUMN_ORDER.filter((column) => landingCell(state.board, column) !== null).map((column) => ({
      move: column,
      state: play(state, seat, column).state,
    })),
  evaluate,
};

/** The best moves for `seat`, for tests and anything else that wants more than one answer. */
export function bestMoves(state: FourState, seat: Seat, options: SearchOptions) {
  return searchBestMoves(SEARCH, state, seat, options);
}

export function chooseMove(state: FourState, seat: Seat, { level, rng }: BotOptions): FourMove {
  const config = BOT_LEVELS[level];
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  if (rng() < config.randomChance) return pick(rng, legal);
  return pick(rng, searchBestMoves(SEARCH, state, seat, config).moves);
}
