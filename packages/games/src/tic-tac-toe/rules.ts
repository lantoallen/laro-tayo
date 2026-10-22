import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

export const CELLS = 9;

/** Seat 0 plays X and seat 1 plays O. Null is an empty cell. */
export type Mark = Seat | null;

/** Cells are read left to right from the top row. */
export interface TicTacToeState {
  board: Mark[];
  /** Whose turn it is, or null once the game is over. */
  turn: Seat | null;
  /** The winner once the game is over, or null for a draw. */
  winner: Seat | null;
  /** The three cells that won the game. */
  line: number[];
  last: number | null;
  turns: number;
}

/** The cell to mark. */
export type TicTacToeMove = number;

export type TicTacToeEvent = { type: "mark"; cell: number } | { type: "gameOver"; winner: Seat | null };

/** Every row, column, and diagonal. */
export const LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): TicTacToeState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Tic-Tac-Toe is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Tic-Tac-Toe`);
  return { board: Array(CELLS).fill(null), turn: firstSeat, winner: null, line: [], last: null, turns: 0 };
}

export function legalMoves(state: TicTacToeState, seat: Seat): TicTacToeMove[] {
  if (state.turn !== seat) return [];
  return state.board.flatMap((mark, cell) => (mark === null ? [cell] : []));
}

export function play(
  state: TicTacToeState,
  seat: Seat,
  move: TicTacToeMove,
): MoveOutcome<TicTacToeState, TicTacToeEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Number.isInteger(move) || move < 0 || move >= CELLS) throw new IllegalMoveError(`There's no cell ${move}`);
  if (state.board[move] !== null) throw new IllegalMoveError(`Cell ${move} is taken`);

  const board = [...state.board];
  board[move] = seat;
  const line = LINES.find((cells) => cells.every((cell) => board[cell] === seat)) ?? [];
  const over = line.length > 0 || board.every((mark) => mark !== null);
  const winner = line.length > 0 ? seat : null;
  const events: TicTacToeEvent[] = [{ type: "mark", cell: move }];
  if (over) events.push({ type: "gameOver", winner });
  return {
    state: { board, turn: over ? null : otherSeat(seat), winner, line: [...line], last: move, turns: state.turns + 1 },
    events,
  };
}

export function result(state: TicTacToeState): GameResult | null {
  if (state.turn !== null) return null;
  return {
    winners: state.winner === null ? [] : [state.winner],
    scores: [0, 1].map((seat) => (state.winner === seat ? 1 : 0)),
  };
}
