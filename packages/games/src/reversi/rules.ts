import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

export const SIZE = 8;
export const SQUARES = SIZE * SIZE;

/** Whose disc is on a square, or null for an empty one. Seat 0 plays black and seat 1 white. */
export type Disc = Seat | null;

export interface LastMove {
  seat: Seat;
  square: number;
  flipped: number[];
}

/** Squares are read left to right from the top row. */
export interface ReversiState {
  board: Disc[];
  /** Whose turn it is, or null once the game is over. */
  turn: Seat | null;
  last: LastMove | null;
  /** A seat that had no move after the last one, so the other seat goes again. */
  passed: Seat | null;
  turns: number;
}

/** The square to place a disc on. */
export type ReversiMove = number;

export type ReversiEvent =
  | { type: "place"; square: number }
  | { type: "flip"; squares: number[] }
  | { type: "pass"; seat: Seat }
  | { type: "gameOver"; winner: Seat | null };

export const rowOf = (square: number) => Math.floor(square / SIZE);
export const colOf = (square: number) => square % SIZE;

const DIRECTIONS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

/** Black starts on d5 and e4, white on d4 and e5, and black usually goes first. */
export function setup(options: { seats?: number; firstSeat?: Seat } = {}): ReversiState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Reversi is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Reversi`);
  const board = Array<Disc>(SQUARES).fill(null);
  board[3 * SIZE + 3] = 1;
  board[3 * SIZE + 4] = 0;
  board[4 * SIZE + 3] = 0;
  board[4 * SIZE + 4] = 1;
  return { board, turn: firstSeat, last: null, passed: null, turns: 0 };
}

/** The discs `seat` would flip by playing on `square`. An empty list means it isn't a legal move. */
export function flipsFor(board: readonly Disc[], seat: Seat, square: number): number[] {
  if (board[square] !== null) return [];
  const flips: number[] = [];
  for (const [dr, dc] of DIRECTIONS) {
    const run: number[] = [];
    let row = rowOf(square) + dr;
    let col = colOf(square) + dc;
    while (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
      const disc = board[row * SIZE + col];
      if (disc === null) break;
      if (disc === seat) {
        flips.push(...run);
        break;
      }
      run.push(row * SIZE + col);
      row += dr;
      col += dc;
    }
  }
  return flips.sort((a, b) => a - b);
}

/** Every square `seat` could play on, whether or not it's their turn. */
export function movesFor(board: readonly Disc[], seat: Seat): number[] {
  const moves: number[] = [];
  for (let square = 0; square < SQUARES; square++) {
    if (flipsFor(board, seat, square).length > 0) moves.push(square);
  }
  return moves;
}

export function legalMoves(state: ReversiState, seat: Seat): ReversiMove[] {
  return state.turn === seat ? movesFor(state.board, seat) : [];
}

export function countDiscs(board: readonly Disc[], seat: Seat): number {
  return board.filter((disc) => disc === seat).length;
}

/** The seat with more discs, or null for a tie. */
function leader(board: readonly Disc[]): Seat | null {
  const difference = countDiscs(board, 0) - countDiscs(board, 1);
  return difference === 0 ? null : difference > 0 ? 0 : 1;
}

/**
 * Places a disc and flips everything it traps. If the other player then has
 * no move they pass, and if neither player can move the game is over.
 */
export function play(state: ReversiState, seat: Seat, move: ReversiMove): MoveOutcome<ReversiState, ReversiEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Number.isInteger(move) || move < 0 || move >= SQUARES) throw new IllegalMoveError(`There's no square ${move}`);
  const flipped = flipsFor(state.board, seat, move);
  if (flipped.length === 0) throw new IllegalMoveError(`Square ${move} doesn't flip anything`);

  const board = [...state.board];
  board[move] = seat;
  for (const square of flipped) board[square] = seat;
  const events: ReversiEvent[] = [
    { type: "place", square: move },
    { type: "flip", squares: flipped },
  ];

  const other = otherSeat(seat);
  let turn: Seat | null = other;
  let passed: Seat | null = null;
  if (movesFor(board, other).length === 0) {
    if (movesFor(board, seat).length > 0) {
      turn = seat;
      passed = other;
      events.push({ type: "pass", seat: other });
    } else {
      turn = null;
      events.push({ type: "gameOver", winner: leader(board) });
    }
  }
  return {
    state: { board, turn, last: { seat, square: move, flipped }, passed, turns: state.turns + 1 },
    events,
  };
}

export function result(state: ReversiState): GameResult | null {
  if (state.turn !== null) return null;
  const winner = leader(state.board);
  return { winners: winner === null ? [] : [winner], scores: [countDiscs(state.board, 0), countDiscs(state.board, 1)] };
}
