import { checkSeats, leaders, nextSeat } from "../engine/seats";
import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

/** Boxes along each side. The board has one more dot than that along each side. */
export const SIZE = 5;
export const DOTS = SIZE + 1;
export const BOXES = SIZE * SIZE;
/** Horizontal lines come first, a row of SIZE for each row of dots, then the vertical lines. */
export const HORIZONTAL_LINES = DOTS * SIZE;
export const LINES = HORIZONTAL_LINES + SIZE * DOTS;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

export interface LastMove {
  seat: Seat;
  line: number;
  /** Boxes the line closed. */
  boxes: number[];
}

/** Boxes are read left to right from the top row. */
export interface DotsState {
  /** How many are playing, from 2 to 4. */
  players: number;
  /** Who drew each line, or null for one not drawn yet. */
  lines: (Seat | null)[];
  /** Who closed each box, or null for an open one. */
  boxes: (Seat | null)[];
  /** Whose turn it is, or null once every box is closed. */
  turn: Seat | null;
  last: LastMove | null;
  turns: number;
}

/** The line to draw. */
export type DotsMove = number;

export type DotsEvent =
  | { type: "line"; line: number }
  | { type: "box"; boxes: number[] }
  | { type: "gameOver"; winners: Seat[] };

/** The line along the top of box `col` in row `row`. Row SIZE is the bottom edge. */
export const horizontalLine = (row: number, col: number) => row * SIZE + col;
/** The line along the left of box `col` in row `row`. Column SIZE is the right edge. */
export const verticalLine = (row: number, col: number) => HORIZONTAL_LINES + row * DOTS + col;

export const isHorizontal = (line: number) => line < HORIZONTAL_LINES;

/** The top, bottom, left, and right lines of each box. */
export const BOX_LINES: readonly (readonly number[])[] = Array.from({ length: BOXES }, (_, box) => {
  const row = Math.floor(box / SIZE);
  const col = box % SIZE;
  return [horizontalLine(row, col), horizontalLine(row + 1, col), verticalLine(row, col), verticalLine(row, col + 1)];
});

/** The one or two boxes on either side of each line. */
export const LINE_BOXES: readonly (readonly number[])[] = Array.from({ length: LINES }, (_, line) =>
  BOX_LINES.flatMap((lines, box) => (lines.includes(line) ? [box] : [])),
);

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): DotsState {
  const { seats = 2, firstSeat = 0 } = options;
  checkSeats("Dots and Boxes", seats, MIN_PLAYERS, MAX_PLAYERS, firstSeat);
  return {
    players: seats,
    lines: Array(LINES).fill(null),
    boxes: Array(BOXES).fill(null),
    turn: firstSeat,
    last: null,
    turns: 0,
  };
}

/** How many of a box's four sides are drawn. */
export function sidesDrawn(lines: readonly (Seat | null)[], box: number): number {
  return BOX_LINES[box].filter((line) => lines[line] !== null).length;
}

export function legalMoves(state: DotsState, seat: Seat): DotsMove[] {
  if (state.turn !== seat) return [];
  return state.lines.flatMap((drawn, line) => (drawn === null ? [line] : []));
}

export function countBoxes(boxes: readonly (Seat | null)[], seat: Seat): number {
  return boxes.filter((owner) => owner === seat).length;
}

/** Boxes claimed by each seat. */
export function boxCounts(players: number, boxes: readonly (Seat | null)[]): number[] {
  return Array.from({ length: players }, (_, seat) => countBoxes(boxes, seat));
}

/** Draws a line. Closing a box claims it and gives the same player another turn. */
export function play(state: DotsState, seat: Seat, move: DotsMove): MoveOutcome<DotsState, DotsEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Number.isInteger(move) || move < 0 || move >= LINES) throw new IllegalMoveError(`There's no line ${move}`);
  if (state.lines[move] !== null) throw new IllegalMoveError(`Line ${move} is already drawn`);

  const lines = [...state.lines];
  lines[move] = seat;
  const closed = LINE_BOXES[move].filter((box) => sidesDrawn(lines, box) === 4);
  const boxes = [...state.boxes];
  for (const box of closed) boxes[box] = seat;

  const events: DotsEvent[] = [{ type: "line", line: move }];
  if (closed.length > 0) events.push({ type: "box", boxes: closed });
  const over = boxes.every((owner) => owner !== null);
  if (over) events.push({ type: "gameOver", winners: leaders(boxCounts(state.players, boxes)) });
  return {
    state: {
      players: state.players,
      lines,
      boxes,
      turn: over ? null : closed.length > 0 ? seat : nextSeat(seat, state.players),
      last: { seat, line: move, boxes: closed },
      turns: state.turns + 1,
    },
    events,
  };
}

export function result(state: DotsState): GameResult | null {
  if (state.turn !== null) return null;
  const scores = boxCounts(state.players, state.boxes);
  return { winners: leaders(scores), scores };
}
