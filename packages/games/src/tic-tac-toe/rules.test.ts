import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import { legalMoves, play, result, setup, type TicTacToeState } from "./rules";

/** Marks a list of cells, taking turns from the first player. */
function marks(cells: number[], state: TicTacToeState = setup()): TicTacToeState {
  for (const cell of cells) state = play(state, state.turn!, cell).state;
  return state;
}

describe("Tic-Tac-Toe", () => {
  it("starts empty with the chosen player first", () => {
    const state = setup({ firstSeat: 1 });
    expect(legalMoves(state, 1)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(legalMoves(state, 0)).toEqual([]);
  });

  it.each([
    ["a row", [0, 3, 1, 4, 2], [0, 1, 2]],
    ["a column", [1, 0, 4, 2, 7], [1, 4, 7]],
    ["a diagonal", [0, 1, 4, 2, 8], [0, 4, 8]],
  ])("wins with three in %s", (_, cells, line) => {
    const state = marks(cells);
    expect(state.turn).toBeNull();
    expect(state.winner).toBe(0);
    expect(state.line).toEqual(line);
    expect(result(state)).toEqual({ winners: [0], scores: [1, 0] });
  });

  it("is a draw when the board fills with no line", () => {
    const state = marks([0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(state.turn).toBeNull();
    expect(state.winner).toBeNull();
    expect(result(state)).toEqual({ winners: [], scores: [0, 0] });
  });

  it.each([
    ["a taken cell", 0],
    ["a cell off the board", 9],
    ["half a cell", 1.5],
  ])("turns down %s", (_, cell) => {
    expect(() => play(marks([0]), 1, cell)).toThrow(IllegalMoveError);
  });

  it("always ends within nine moves", () => {
    const rng = createRng(1);
    for (let game = 0; game < 200; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
      expect(state.turns).toBeLessThanOrEqual(9);
    }
  });
});
