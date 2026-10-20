import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

/** Pieces each player starts with. */
export const PIECES = 9;
export const POINTS = 24;
/** Moves in a row with no piece taken before the game is called a draw. */
export const DRAW_AFTER_QUIET_MOVES = 50;

/**
 * The 24 points, numbered left to right and top to bottom across three
 * squares, one inside the other:
 *
 *   0 ----------- 1 ----------- 2
 *   |   3 ------- 4 ------- 5   |
 *   |   |   6 --- 7 --- 8   |   |
 *   9 - 10 - 11        12 - 13 - 14
 *   |   |   15 -- 16 -- 17  |   |
 *   |   18 ------ 19 ------ 20  |
 *   21 ---------- 22 ---------- 23
 */
export const NEIGHBORS: readonly (readonly number[])[] = [
  [1, 9],
  [0, 2, 4],
  [1, 14],
  [4, 10],
  [1, 3, 5, 7],
  [4, 13],
  [7, 11],
  [4, 6, 8],
  [7, 12],
  [0, 10, 21],
  [3, 9, 11, 18],
  [6, 10, 15],
  [8, 13, 17],
  [5, 12, 14, 20],
  [2, 13, 23],
  [11, 16],
  [15, 17, 19],
  [12, 16],
  [10, 19],
  [16, 18, 20, 22],
  [13, 19],
  [9, 22],
  [19, 21, 23],
  [14, 22],
];

/** Every line of three points. Filling one with your pieces is a mill. */
export const MILLS: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
  [12, 13, 14],
  [15, 16, 17],
  [18, 19, 20],
  [21, 22, 23],
  [0, 9, 21],
  [3, 10, 18],
  [6, 11, 15],
  [1, 4, 7],
  [16, 19, 22],
  [8, 12, 17],
  [5, 13, 20],
  [2, 14, 23],
];

export interface LastMove {
  seat: Seat;
  /** Where the piece came from, or null when it was placed from the hand. */
  from: number | null;
  to: number | null;
  /** A piece taken by this move. */
  taken: number | null;
}

export interface MorrisState {
  board: (Seat | null)[];
  /** Pieces each seat still has to place. */
  inHand: [number, number];
  /** Whose turn it is, or null once the game is over. */
  turn: Seat | null;
  /** True when the player to move just made a mill and has to take a piece. */
  taking: boolean;
  /** The winner once the game is over, or null for a draw. */
  winner: Seat | null;
  last: LastMove | null;
  /** Moves since a piece was last taken, for the draw rule. */
  quietMoves: number;
  turns: number;
}

export type MorrisMove = { place: number } | { from: number; to: number } | { take: number };

export type MorrisEvent =
  | { type: "place"; point: number }
  | { type: "move"; from: number; to: number }
  | { type: "mill"; points: number[] }
  | { type: "take"; point: number }
  | { type: "gameOver"; winner: Seat | null };

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): MorrisState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Nine Men's Morris is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Nine Men's Morris`);
  return {
    board: Array(POINTS).fill(null),
    inHand: [PIECES, PIECES],
    turn: firstSeat,
    taking: false,
    winner: null,
    last: null,
    quietMoves: 0,
    turns: 0,
  };
}

export function countOnBoard(board: readonly (Seat | null)[], seat: Seat): number {
  return board.filter((owner) => owner === seat).length;
}

/** Pieces a seat has left, on the board and in hand. */
export function piecesLeft(state: MorrisState, seat: Seat): number {
  return countOnBoard(state.board, seat) + state.inHand[seat];
}

/** The mills through a point that are full of one seat's pieces. */
export function millsAt(board: readonly (Seat | null)[], point: number): (readonly number[])[] {
  const seat = board[point];
  if (seat === null) return [];
  return MILLS.filter((mill) => mill.includes(point) && mill.every((p) => board[p] === seat));
}

/** Pieces of `seat` the other player may take: ones outside a mill, or any if all of them are in mills. */
export function takeable(board: readonly (Seat | null)[], seat: Seat): number[] {
  const pieces = board.flatMap((owner, point) => (owner === seat ? [point] : []));
  const loose = pieces.filter((point) => millsAt(board, point).length === 0);
  return loose.length > 0 ? loose : pieces;
}

/** With three pieces left and none in hand, a player's pieces can fly to any empty point. */
export function canFly(state: MorrisState, seat: Seat): boolean {
  return state.inHand[seat] === 0 && countOnBoard(state.board, seat) === 3;
}

/** Every move `seat` could make on the board as it stands, whether or not it's their turn. */
export function movesFor(state: MorrisState, seat: Seat): MorrisMove[] {
  const empty = state.board.flatMap((owner, point) => (owner === null ? [point] : []));
  if (state.inHand[seat] > 0) return empty.map((point) => ({ place: point }));
  const fly = canFly(state, seat);
  return state.board.flatMap((owner, from) => {
    if (owner !== seat) return [];
    const targets = fly ? empty : NEIGHBORS[from].filter((point) => state.board[point] === null);
    return targets.map((to) => ({ from, to }));
  });
}

export function legalMoves(state: MorrisState, seat: Seat): MorrisMove[] {
  if (state.turn !== seat) return [];
  if (state.taking) return takeable(state.board, otherSeat(seat)).map((point) => ({ take: point }));
  return movesFor(state, seat);
}

const sameMove = (a: MorrisMove, b: MorrisMove) => JSON.stringify(a) === JSON.stringify(b);

/** Reads a move sent from anywhere, such as over the network. Returns null for anything that isn't one. */
function parseMove(move: unknown): MorrisMove | null {
  if (typeof move !== "object" || move === null) return null;
  const keys = Object.keys(move).sort().join();
  const values = Object.values(move);
  if (!values.every((value) => Number.isInteger(value))) return null;
  if (keys === "place") return { place: (move as { place: number }).place };
  if (keys === "take") return { take: (move as { take: number }).take };
  if (keys === "from,to") return { from: (move as { from: number }).from, to: (move as { to: number }).to };
  return null;
}

/** Ends the turn: the other player moves next, unless they're out of pieces or moves. */
function passTurn(state: MorrisState, seat: Seat, events: MorrisEvent[]): MorrisState {
  const other = otherSeat(seat);
  let winner: Seat | null = null;
  let over = false;
  if (piecesLeft(state, other) < 3 || movesFor(state, other).length === 0) {
    winner = seat;
    over = true;
  } else if (state.quietMoves >= DRAW_AFTER_QUIET_MOVES) {
    over = true;
  }
  if (over) events.push({ type: "gameOver", winner });
  return { ...state, turn: over ? null : other, taking: false, winner };
}

export function play(state: MorrisState, seat: Seat, rawMove: MorrisMove): MoveOutcome<MorrisState, MorrisEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  const move = parseMove(rawMove);
  if (move === null || !legalMoves(state, seat).some((legal) => sameMove(legal, move))) {
    throw new IllegalMoveError(`That isn't a legal move: ${JSON.stringify(rawMove)}`);
  }

  const board = [...state.board];
  const inHand: [number, number] = [...state.inHand];
  const events: MorrisEvent[] = [];
  const turns = state.turns + 1;

  if ("take" in move) {
    board[move.take] = null;
    events.push({ type: "take", point: move.take });
    const last = { ...state.last!, taken: move.take };
    return { state: passTurn({ ...state, board, last, quietMoves: 0, turns }, seat, events), events };
  }

  let to: number;
  let from: number | null = null;
  if ("place" in move) {
    to = move.place;
    inHand[seat]--;
    events.push({ type: "place", point: to });
  } else {
    ({ from, to } = move);
    board[from] = null;
    events.push({ type: "move", from, to });
  }
  board[to] = seat;

  const next: MorrisState = {
    ...state,
    board,
    inHand,
    last: { seat, from, to, taken: null },
    quietMoves: state.quietMoves + 1,
    turns,
  };
  const mills = millsAt(board, to);
  if (mills.length > 0) {
    events.push({ type: "mill", points: [...new Set(mills.flat())].sort((a, b) => a - b) });
    // A mill takes a piece, if the other player has one on the board to take.
    if (countOnBoard(board, otherSeat(seat)) > 0) return { state: { ...next, taking: true }, events };
  }
  return { state: passTurn(next, seat, events), events };
}

export function result(state: MorrisState): GameResult | null {
  if (state.turn !== null) return null;
  return {
    winners: state.winner === null ? [] : [state.winner],
    scores: [piecesLeft(state, 0), piecesLeft(state, 1)],
  };
}
