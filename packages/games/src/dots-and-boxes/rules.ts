import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

/** Boxes along each side. The board has one more dot than that along each side. */
export const SIZE = 5;
export const DOTS = SIZE + 1;
export const BOXES = SIZE * SIZE;
/** Horizontal lines come first, a row of SIZE for each row of dots, then the vertical lines. */
export const HORIZONTAL_LINES = DOTS * SIZE;
export const LINES = HORIZONTAL_LINES + SIZE * DOTS;

export interface LastMove {
  seat: Seat;
  line: number;
  /** Boxes the line closed. */
  boxes: number[];
}

/** Boxes are read left to right from the top row. */
export interface DotsState {
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
  { type: "line"; line: number } | { type: "box"; boxes: number[] } | { type: "gameOver"; winner: Seat | null };

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

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): DotsState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Dots and Boxes is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Dots and Boxes`);
  return {
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

/** The seat with more boxes, or null for a tie. */
function leader(boxes: readonly (Seat | null)[]): Seat | null {
  const difference = countBoxes(boxes, 0) - countBoxes(boxes, 1);
  return difference === 0 ? null : difference > 0 ? 0 : 1;
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
  if (over) events.push({ type: "gameOver", winner: leader(boxes) });
  return {
    state: {
      lines,
      boxes,
      turn: over ? null : closed.length > 0 ? seat : otherSeat(seat),
      last: { seat, line: move, boxes: closed },
      turns: state.turns + 1,
    },
    events,
  };
}

export function result(state: DotsState): GameResult | null {
  if (state.turn !== null) return null;
  const winner = leader(state.boxes);
  return { winners: winner === null ? [] : [winner], scores: [countBoxes(state.boxes, 0), countBoxes(state.boxes, 1)] };
}
