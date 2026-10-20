import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError, type Seat } from "../engine/types";
import { POINTS, legalMoves, piecesLeft, play, result, setup, type MorrisMove, type MorrisState } from "./rules";

/** A position with pieces on the given points and nothing left to place unless `inHand` says so. */
function stateWith(red: number[], blue: number[], turn: Seat = 0, inHand: [number, number] = [0, 0]): MorrisState {
  const board = Array.from({ length: POINTS }, (_, point) =>
    red.includes(point) ? 0 : blue.includes(point) ? 1 : null,
  );
  return { ...setup(), board, inHand, turn };
}

describe("placing", () => {
  it("starts with nine pieces each to place on any of the 24 points", () => {
    const state = setup({ firstSeat: 1 });
    expect(state.inHand).toEqual([9, 9]);
    expect(legalMoves(state, 1)).toHaveLength(24);
    expect(legalMoves(state, 0)).toEqual([]);
  });

  it("puts a piece down and passes the turn", () => {
    const state = play(setup(), 0, { place: 4 }).state;
    expect(state.board[4]).toBe(0);
    expect(state.inHand).toEqual([8, 9]);
    expect(state.turn).toBe(1);
  });

  it("takes a piece after making a mill, but not one from a mill", () => {
    const before = stateWith([0, 1], [6, 7, 8, 20], 0, [3, 3]);
    const milled = play(before, 0, { place: 2 }).state;
    expect(milled.taking).toBe(true);
    expect(milled.turn).toBe(0);
    expect(legalMoves(milled, 0)).toEqual([{ take: 20 }]);
    const taken = play(milled, 0, { take: 20 }).state;
    expect(taken.board[20]).toBeNull();
    expect(taken.turn).toBe(1);
    expect(taken.last).toEqual({ seat: 0, from: null, to: 2, taken: 20 });
  });

  it("can take from a mill when every piece is in one", () => {
    const milled = play(stateWith([0, 1], [6, 7, 8], 0, [3, 3]), 0, { place: 2 }).state;
    expect(legalMoves(milled, 0)).toEqual([{ take: 6 }, { take: 7 }, { take: 8 }]);
  });

  it("skips taking when the other player has nothing on the board", () => {
    const state = play(stateWith([0, 1], [], 0, [7, 9]), 0, { place: 2 }).state;
    expect(state.taking).toBe(false);
    expect(state.turn).toBe(1);
  });
});

describe("moving", () => {
  it("moves a piece along a line to the next empty point", () => {
    const state = stateWith([4, 18, 20, 21], [0, 2, 23]);
    const moves = legalMoves(state, 0);
    expect(moves).toContainEqual({ from: 4, to: 7 });
    expect(moves).not.toContainEqual({ from: 4, to: 19 });
  });

  it("lets a player with three pieces fly to any empty point", () => {
    const state = stateWith([4, 20, 21], [0, 2, 23, 9]);
    expect(legalMoves(state, 0)).toContainEqual({ from: 4, to: 16 });
  });

  it("wins when the other player is left with two pieces", () => {
    const milled = play(stateWith([0, 1, 14, 18], [6, 7, 12]), 0, { from: 14, to: 2 }).state;
    const { state } = play(milled, 0, { take: 6 });
    expect(state.turn).toBeNull();
    expect(result(state)).toEqual({ winners: [0], scores: [4, 2] });
  });

  it("wins when the other player can't move", () => {
    const state = play(stateWith([1, 9, 14, 22, 4], [0, 2, 21, 23]), 0, { from: 4, to: 7 }).state;
    expect(state.turn).toBeNull();
    expect(state.winner).toBe(0);
  });

  it.each<[string, unknown]>([
    ["a point off the board", { place: 24 }],
    ["a point that's taken", { place: 1 }],
    ["a jump that isn't along a line", { from: 4, to: 19 }],
    ["a move with extra parts", { place: 3, take: 5 }],
    ["a number", 3],
    ["nothing", null],
  ])("turns down %s", (_, move) => {
    expect(() => play(stateWith([1, 4, 20], [0, 2, 23], 0, [3, 3]), 0, move as MorrisMove)).toThrow(IllegalMoveError);
  });
});

describe("random games", () => {
  it("always end, with a win or the draw rule", () => {
    const rng = createRng(17);
    for (let game = 0; game < 150; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
      const { winners, scores } = result(state)!;
      expect(scores).toEqual([piecesLeft(state, 0), piecesLeft(state, 1)]);
      if (winners.length > 0) expect(piecesLeft(state, winners[0])).toBeGreaterThanOrEqual(3);
    }
  });
});
