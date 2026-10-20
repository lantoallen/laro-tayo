import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

export const COLUMNS = 7;
export const ROWS = 6;
export const CELLS = COLUMNS * ROWS;

/** Whose disc is in a cell, or null for an empty one. */
export type Cell = Seat | null;

/** Cells are read left to right from the top row. Discs fall to the lowest empty cell in their column. */
export interface FourState {
  board: Cell[];
  /** Whose turn it is, or null once the game is over. */
  turn: Seat | null;
  /** The winner once the game is over, or null for a draw. */
  winner: Seat | null;
  /** The cells that made the winning line. */
  line: number[];
  /** Where the last disc landed. */
  last: number | null;
  turns: number;
}

/** The column to drop a disc in, from 0 on the left. */
export type FourMove = number;

export type FourEvent = { type: "drop"; column: number; cell: number } | { type: "gameOver"; winner: Seat | null };

export const rowOf = (cell: number) => Math.floor(cell / COLUMNS);
export const colOf = (cell: number) => cell % COLUMNS;

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): FourState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Four in a Row is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Four in a Row`);
  return { board: Array<Cell>(CELLS).fill(null), turn: firstSeat, winner: null, line: [], last: null, turns: 0 };
}

/** The cell a disc dropped in this column lands in, or null when the column is full. */
export function landingCell(board: readonly Cell[], column: number): number | null {
  for (let row = ROWS - 1; row >= 0; row--) {
    const cell = row * COLUMNS + column;
    if (board[cell] === null) return cell;
  }
  return null;
}

export function legalMoves(state: FourState, seat: Seat): FourMove[] {
  if (state.turn !== seat) return [];
  return Array.from({ length: COLUMNS }, (_, column) => column).filter(
    (column) => landingCell(state.board, column) !== null,
  );
}

const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
] as const;

/** Every cell in a line of four or more that runs through `cell`, or an empty list. */
export function winningLine(board: readonly Cell[], cell: number): number[] {
  const seat = board[cell];
  if (seat === null) return [];
  const line = new Set<number>();
  for (const [dr, dc] of DIRECTIONS) {
    const run = [cell];
    for (const sign of [1, -1]) {
      let row = rowOf(cell) + dr * sign;
      let col = colOf(cell) + dc * sign;
      while (row >= 0 && row < ROWS && col >= 0 && col < COLUMNS && board[row * COLUMNS + col] === seat) {
        run.push(row * COLUMNS + col);
        row += dr * sign;
        col += dc * sign;
      }
    }
    if (run.length >= 4) for (const c of run) line.add(c);
  }
  return [...line].sort((a, b) => a - b);
}

export function play(state: FourState, seat: Seat, move: FourMove): MoveOutcome<FourState, FourEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Number.isInteger(move) || move < 0 || move >= COLUMNS) throw new IllegalMoveError(`There's no column ${move}`);
  const cell = landingCell(state.board, move);
  if (cell === null) throw new IllegalMoveError(`Column ${move + 1} is full`);

  const board = [...state.board];
  board[cell] = seat;
  const line = winningLine(board, cell);
  const over = line.length > 0 || board.every((c) => c !== null);
  const winner = line.length > 0 ? seat : null;
  const events: FourEvent[] = [{ type: "drop", column: move, cell }];
  if (over) events.push({ type: "gameOver", winner });
  return {
    state: { board, turn: over ? null : otherSeat(seat), winner, line, last: cell, turns: state.turns + 1 },
    events,
  };
}

export function countDiscs(board: readonly Cell[], seat: Seat): number {
  return board.filter((cell) => cell === seat).length;
}

export function result(state: FourState): GameResult | null {
  if (state.turn !== null) return null;
  return {
    winners: state.winner === null ? [] : [state.winner],
    scores: [0, 1].map((seat) => (state.winner === seat ? 1 : 0)),
  };
}
