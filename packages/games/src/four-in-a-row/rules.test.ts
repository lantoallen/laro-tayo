import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import { CELLS, COLUMNS, countDiscs, legalMoves, play, result, setup, type Cell, type FourState } from "./rules";

/** The cell at a row and column, counting from the top left. */
const at = (row: number, col: number) => row * COLUMNS + col;

/** Plays a list of columns, taking turns from the first player. */
function drops(columns: number[], state: FourState = setup()): FourState {
  for (const column of columns) state = play(state, state.turn!, column).state;
  return state;
}

/** A board from six strings of seven characters: x for seat 0, o for seat 1, and . for empty. */
function boardFrom(rows: string[]): Cell[] {
  return rows
    .join("")
    .split("")
    .map((c) => (c === "x" ? 0 : c === "o" ? 1 : null));
}

describe("setup", () => {
  it("starts with an empty board and the chosen player first", () => {
    const state = setup({ firstSeat: 1 });
    expect(state.board).toHaveLength(CELLS);
    expect(state.board.every((cell) => cell === null)).toBe(true);
    expect(state.turn).toBe(1);
    expect(legalMoves(state, 1)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(legalMoves(state, 0)).toEqual([]);
  });
});

describe("dropping a disc", () => {
  it("lands on the bottom row, then stacks up", () => {
    const state = drops([3, 3]);
    expect(state.board[at(5, 3)]).toBe(0);
    expect(state.board[at(4, 3)]).toBe(1);
    expect(state.last).toBe(at(4, 3));
    expect(state.turn).toBe(0);
  });

  it("can't go in a full column", () => {
    const full = drops([0, 0, 0, 0, 0, 0]);
    expect(legalMoves(full, 0)).not.toContain(0);
    expect(() => play(full, 0, 0)).toThrow(IllegalMoveError);
  });

  it.each([-1, 7, 2.5, Number.NaN])("turns down column %s", (column) => {
    expect(() => play(setup(), 0, column)).toThrow(IllegalMoveError);
  });

  it("turns down a move out of turn", () => {
    expect(() => play(setup(), 1, 3)).toThrow(IllegalMoveError);
  });
});

describe("winning", () => {
  it("wins with four across", () => {
    const state = drops([0, 0, 1, 1, 2, 2, 3]);
    expect(state.turn).toBeNull();
    expect(state.winner).toBe(0);
    expect(state.line).toEqual([at(5, 0), at(5, 1), at(5, 2), at(5, 3)]);
    expect(result(state)).toEqual({ winners: [0], scores: [1, 0] });
  });

  it("wins with four up a column", () => {
    const state = drops([4, 0, 4, 0, 4, 1, 4]);
    expect(state.winner).toBe(0);
    expect(state.line).toEqual([at(2, 4), at(3, 4), at(4, 4), at(5, 4)]);
  });

  it("wins with four on a diagonal", () => {
    const board = boardFrom([".......", ".......", ".......", "..ox...", ".oxo...", "oxxx..."]);
    const state = play({ board, turn: 1, winner: null, line: [], last: null, turns: 9 }, 1, 3).state;
    expect(state.winner).toBe(1);
    expect(state.line).toEqual([at(2, 3), at(3, 2), at(4, 1), at(5, 0)]);
  });

  it("counts every disc in a line longer than four", () => {
    const state = drops([0, 0, 1, 1, 2, 2, 4, 4, 3]);
    expect(state.line).toEqual([at(5, 0), at(5, 1), at(5, 2), at(5, 3), at(5, 4)]);
  });

  it("is a draw when the board fills with no line of four", () => {
    const board = boardFrom(["xxooxx.", "ooxxoox", "xxooxxo", "ooxxoox", "xxooxxo", "ooxxoox"]);
    const almost: FourState = { board, turn: 1, winner: null, line: [], last: null, turns: 41 };
    const state = play(almost, 1, 6).state;
    expect(state.turn).toBeNull();
    expect(state.winner).toBeNull();
    expect(result(state)).toEqual({ winners: [], scores: [0, 0] });
  });
});

describe("random games", () => {
  it("always end, with the players taking turns", () => {
    const rng = createRng(11);
    for (let game = 0; game < 200; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) {
        const before = countDiscs(state.board, state.turn);
        const seat = state.turn;
        state = play(state, seat, pick(rng, legalMoves(state, seat))).state;
        expect(countDiscs(state.board, seat)).toBe(before + 1);
      }
      const difference = countDiscs(state.board, 0) - countDiscs(state.board, 1);
      expect(Math.abs(difference)).toBeLessThanOrEqual(1);
      expect(result(state)).not.toBeNull();
    }
  });
});
