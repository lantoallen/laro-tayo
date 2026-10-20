import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError, type Seat } from "../engine/types";
import { SQUARES, countDiscs, legalMoves, movesFor, play, result, setup, type Disc, type ReversiState } from "./rules";

/** The square at a row and column, counting from the top left. */
const at = (row: number, col: number) => row * 8 + col;

/** A board from eight strings of eight characters: x for black (seat 0), o for white (seat 1), and . for empty. */
function stateFrom(rows: string[], turn: Seat = 0): ReversiState {
  const board = rows
    .join("")
    .split("")
    .map((c): Disc => (c === "x" ? 0 : c === "o" ? 1 : null));
  return { board, turn, last: null, passed: null, turns: 0 };
}

describe("setup", () => {
  it("starts with two discs each in the middle", () => {
    const state = setup();
    expect(state.board).toHaveLength(SQUARES);
    expect(state.board[at(3, 3)]).toBe(1);
    expect(state.board[at(3, 4)]).toBe(0);
    expect(state.board[at(4, 3)]).toBe(0);
    expect(state.board[at(4, 4)]).toBe(1);
    expect(state.turn).toBe(0);
  });

  it("gives black four opening moves", () => {
    expect(legalMoves(setup(), 0)).toEqual([at(2, 3), at(3, 2), at(4, 5), at(5, 4)]);
    expect(legalMoves(setup(), 1)).toEqual([]);
  });
});

describe("placing a disc", () => {
  it("flips the discs it traps", () => {
    const { state, events } = play(setup(), 0, at(2, 3));
    expect(state.board[at(3, 3)]).toBe(0);
    expect(countDiscs(state.board, 0)).toBe(4);
    expect(countDiscs(state.board, 1)).toBe(1);
    expect(state.last).toEqual({ seat: 0, square: at(2, 3), flipped: [at(3, 3)] });
    expect(state.turn).toBe(1);
    expect(events).toEqual([
      { type: "place", square: at(2, 3) },
      { type: "flip", squares: [at(3, 3)] },
    ]);
  });

  it("flips in every direction at once, but only lines that end in one of yours", () => {
    const before = stateFrom([
      "........",
      "........",
      "...o....",
      "....ox..",
      "...oo...",
      "...x.x..",
      "........",
      "........",
    ]);
    const { state } = play(before, 0, at(3, 3));
    expect(state.last?.flipped).toEqual([at(3, 4), at(4, 3), at(4, 4)]);
    expect(state.board[at(2, 3)]).toBe(1);
    expect(state.turn).toBe(1);
  });

  it.each([
    ["a square that flips nothing", 0],
    ["a square with a disc on it", at(3, 3)],
    ["a square off the board", 64],
    ["half a square", 2.5],
  ])("turns down %s", (_, square) => {
    expect(() => play(setup(), 0, square)).toThrow(IllegalMoveError);
  });

  it("turns down a move out of turn", () => {
    expect(() => play(setup(), 1, at(2, 4))).toThrow(IllegalMoveError);
  });
});

describe("random games", () => {
  it("pass when a player has no move, and end when neither does", () => {
    const rng = createRng(21);
    let passes = 0;
    for (let game = 0; game < 150; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) {
        const seat = state.turn;
        const discs = countDiscs(state.board, 0) + countDiscs(state.board, 1);
        state = play(state, seat, pick(rng, legalMoves(state, seat))).state;
        expect(countDiscs(state.board, 0) + countDiscs(state.board, 1)).toBe(discs + 1);
        if (state.passed !== null) {
          passes++;
          expect(state.turn).toBe(seat);
          expect(movesFor(state.board, state.passed)).toEqual([]);
        }
      }
      expect(movesFor(state.board, 0)).toEqual([]);
      expect(movesFor(state.board, 1)).toEqual([]);
      const { winners, scores } = result(state)!;
      expect(scores).toEqual([countDiscs(state.board, 0), countDiscs(state.board, 1)]);
      if (scores[0] === scores[1]) expect(winners).toEqual([]);
      else expect(winners).toEqual([scores[0] > scores[1] ? 0 : 1]);
    }
    expect(passes).toBeGreaterThan(0);
  });
});
