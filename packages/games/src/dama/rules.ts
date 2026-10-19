import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

export const SIZE = 8;
export const SQUARES = SIZE * SIZE;
/** Moves in a row with no capture and no man moved before the game is called a draw. */
export const DRAW_AFTER_QUIET_MOVES = 40;

/**
 * What is on a square: 0 is empty, 1 a man of seat 0, 2 a king of seat 0,
 * -1 a man of seat 1, and -2 a king of seat 1.
 */
export type Piece = -2 | -1 | 0 | 1 | 2;

/**
 * The board is 64 squares, read left to right from the top row. Only dark
 * squares are used. Seat 0 starts on the bottom three rows and moves up.
 */
export interface DamaState {
  board: Piece[];
  /** Whose turn it is, or null once the game is over. */
  turn: Seat | null;
  /** The winner once the game is over, or null for a draw. */
  winner: Seat | null;
  /** Moves in a row with no capture and no man moved, for the draw rule. */
  quietMoves: number;
  turns: number;
}

/** The square a piece starts on, then every square it lands on. */
export type DamaMove = number[];

export type DamaEvent =
  | { type: "step"; from: number; to: number }
  /** Captured pieces come off together once the whole capture is done. */
  | { type: "capture"; squares: number[] }
  | { type: "promote"; square: number }
  | { type: "gameOver"; winner: Seat | null };

/** A legal move with the pieces it captures. */
export interface FullMove {
  path: number[];
  captured: number[];
}

const DIRECTIONS = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
] as const;

export const rowOf = (square: number) => Math.floor(square / SIZE);
export const colOf = (square: number) => square % SIZE;

export function isDark(square: number): boolean {
  return (rowOf(square) + colOf(square)) % 2 === 1;
}

export function ownerOf(piece: number): Seat | null {
  if (piece > 0) return 0;
  if (piece < 0) return 1;
  return null;
}

export function isKing(piece: number): boolean {
  return Math.abs(piece) === 2;
}

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

/** The row a seat's men move toward, and are crowned on. */
export function crownRow(seat: Seat): number {
  return seat === 0 ? 0 : SIZE - 1;
}

/** One square along a diagonal, or null off the edge of the board. */
function stepFrom(square: number, dr: number, dc: number): number | null {
  const r = rowOf(square) + dr;
  const c = colOf(square) + dc;
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE ? r * SIZE + c : null;
}

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): DamaState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Dama is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Dama`);
  const board = Array.from({ length: SQUARES }, (_, square): Piece => {
    if (!isDark(square)) return 0;
    if (rowOf(square) <= 2) return -1;
    if (rowOf(square) >= SIZE - 3) return 1;
    return 0;
  });
  return { board, turn: firstSeat, winner: null, quietMoves: 0, turns: 0 };
}

/**
 * Every way a piece can capture. Captured pieces stay on the board until the
 * capture ends, so they can't be jumped twice and they block the way.
 */
function capturesFrom(board: readonly Piece[], from: number): FullMove[] {
  const piece = board[from];
  const enemy = otherSeat(ownerOf(piece)!);
  const king = isKing(piece);
  const results: FullMove[] = [];
  // The capturing piece has left its square, which other jumps may cross.
  const empty = (square: number) => square === from || board[square] === 0;

  function search(at: number, path: number[], captured: number[]) {
    let continued = false;
    for (const [dr, dc] of DIRECTIONS) {
      let over = stepFrom(at, dr, dc);
      // Kings can reach a piece from any distance along the diagonal.
      if (king) while (over !== null && empty(over)) over = stepFrom(over, dr, dc);
      if (over === null || ownerOf(board[over]) !== enemy || captured.includes(over)) continue;

      let land = stepFrom(over, dr, dc);
      while (land !== null && empty(land)) {
        continued = true;
        search(land, [...path, land], [...captured, over]);
        // A man lands right behind the piece it takes. A king may stop on any empty square past it.
        if (!king) break;
        land = stepFrom(land, dr, dc);
      }
    }
    if (!continued && captured.length > 0) results.push({ path, captured });
  }

  search(from, [from], []);
  return results;
}

function quietMovesFrom(board: readonly Piece[], from: number): FullMove[] {
  const piece = board[from];
  const seat = ownerOf(piece)!;
  const moves: FullMove[] = [];
  for (const [dr, dc] of DIRECTIONS) {
    if (isKing(piece)) {
      let to = stepFrom(from, dr, dc);
      while (to !== null && board[to] === 0) {
        moves.push({ path: [from, to], captured: [] });
        to = stepFrom(to, dr, dc);
      }
    } else if (dr === (seat === 0 ? -1 : 1)) {
      const to = stepFrom(from, dr, dc);
      if (to !== null && board[to] === 0) moves.push({ path: [from, to], captured: [] });
    }
  }
  return moves;
}

/** Every legal move for a seat. Capturing is required, and so is taking the most pieces possible. */
export function fullMoves(board: readonly Piece[], seat: Seat): FullMove[] {
  let best: FullMove[] = [];
  let most = 0;
  for (let square = 0; square < SQUARES; square++) {
    if (ownerOf(board[square]) !== seat) continue;
    for (const move of capturesFrom(board, square)) {
      if (move.captured.length > most) {
        most = move.captured.length;
        best = [move];
      } else if (move.captured.length === most) {
        best.push(move);
      }
    }
  }
  if (most > 0) return best;

  const quiet: FullMove[] = [];
  for (let square = 0; square < SQUARES; square++) {
    if (ownerOf(board[square]) === seat) quiet.push(...quietMovesFrom(board, square));
  }
  return quiet;
}

export function legalMoves(state: DamaState, seat: Seat): DamaMove[] {
  if (state.turn !== seat) return [];
  return fullMoves(state.board, seat).map((move) => move.path);
}

/** Plays a legal move. Used by `play` and by the bot, which skips the events. */
export function applyMove(state: DamaState, seat: Seat, move: FullMove, events?: DamaEvent[]): DamaState {
  const board = state.board.slice();
  const { path, captured } = move;
  const from = path[0];
  const to = path[path.length - 1];
  let piece = board[from];
  const wasMan = !isKing(piece);

  for (let i = 1; i < path.length; i++) events?.push({ type: "step", from: path[i - 1], to: path[i] });
  board[from] = 0;
  for (const square of captured) board[square] = 0;
  if (captured.length > 0) events?.push({ type: "capture", squares: captured });

  // A man is crowned only if its move ends on the far row.
  if (wasMan && rowOf(to) === crownRow(seat)) {
    piece = (seat === 0 ? 2 : -2) as Piece;
    events?.push({ type: "promote", square: to });
  }
  board[to] = piece;

  const quietMoves = captured.length > 0 || wasMan ? 0 : state.quietMoves + 1;
  const next = otherSeat(seat);
  let turn: Seat | null = next;
  let winner: Seat | null = null;
  if (fullMoves(board, next).length === 0) {
    turn = null;
    winner = seat;
  } else if (quietMoves >= DRAW_AFTER_QUIET_MOVES) {
    turn = null;
  }
  if (turn === null) events?.push({ type: "gameOver", winner });
  return { board, turn, winner, quietMoves, turns: state.turns + 1 };
}

function samePath(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((square, i) => square === b[i]);
}

export function play(state: DamaState, seat: Seat, move: DamaMove): MoveOutcome<DamaState, DamaEvent> {
  if (state.turn === null) throw new IllegalMoveError("The game is already over");
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Array.isArray(move) || move.length < 2 || !move.every((square) => Number.isInteger(square))) {
    throw new IllegalMoveError("A move is a list of squares");
  }
  const full = fullMoves(state.board, seat).find((candidate) => samePath(candidate.path, move));
  if (!full) throw new IllegalMoveError("That move isn't allowed");

  const events: DamaEvent[] = [];
  return { state: applyMove(state, seat, full, events), events };
}

export function countPieces(board: readonly Piece[], seat: Seat): number {
  return board.filter((piece) => ownerOf(piece) === seat).length;
}

export function result(state: DamaState): GameResult | null {
  if (state.turn !== null) return null;
  const scores = [countPieces(state.board, 0), countPieces(state.board, 1)];
  return { winners: state.winner === null ? [] : [state.winner], scores };
}

/** Applies one event to a board, so a screen can replay a move step by step. */
export function applyEvent(board: readonly Piece[], event: DamaEvent): Piece[] {
  const next = board.slice();
  if (event.type === "step") {
    next[event.to] = next[event.from];
    next[event.from] = 0;
  } else if (event.type === "capture") {
    for (const square of event.squares) next[square] = 0;
  } else if (event.type === "promote") {
    next[event.square] = (next[event.square] > 0 ? 2 : -2) as Piece;
  }
  return next;
}
