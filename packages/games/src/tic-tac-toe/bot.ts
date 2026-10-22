import { pick } from "../engine/rng";
import { WIN, searchBestMoves, type SearchGame, type SearchOptions } from "../engine/search";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import { legalMoves, play, type TicTacToeMove, type TicTacToeState } from "./rules";

interface LevelConfig extends SearchOptions {
  /** Chance of playing a random move instead, so easier bots make mistakes. */
  randomChance: number;
}

/** Easy sees its own wins. Medium also blocks yours. Hard looks all the way to the end, so it never loses. */
export const BOT_LEVELS: Record<BotLevel, LevelConfig> = {
  easy: { depth: 1, randomChance: 0.35 },
  medium: { depth: 2, randomChance: 0.1 },
  hard: { depth: 9, randomChance: 0 },
};

/** Center first, then corners, then edges, so the search finds good moves sooner. */
const ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7];

const SEARCH: SearchGame<TicTacToeState, TicTacToeMove> = {
  turn: (state) => state.turn,
  children: (state, seat) =>
    ORDER.filter((cell) => state.board[cell] === null).map((cell) => ({
      move: cell,
      state: play(state, seat, cell).state,
    })),
  evaluate: (state, me) => {
    if (state.turn !== null || state.winner === null) return 0;
    // Faster wins and slower losses score better.
    return state.winner === me ? WIN - state.turns : -WIN + state.turns;
  },
};

/** The best moves for `seat`, for tests and anything else that wants more than one answer. */
export function bestMoves(state: TicTacToeState, seat: Seat, options: SearchOptions) {
  return searchBestMoves(SEARCH, state, seat, options);
}

export function chooseMove(state: TicTacToeState, seat: Seat, { level, rng }: BotOptions): TicTacToeMove {
  const config = BOT_LEVELS[level];
  const legal = legalMoves(state, seat);
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  if (rng() < config.randomChance) return pick(rng, legal);
  return pick(rng, searchBestMoves(SEARCH, state, seat, config).moves);
}
