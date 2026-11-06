import { describe, expect, it } from "vitest";
import { IllegalMoveError } from "../engine/types";
import { legalMoves, play, result, setup } from "./rules";

describe("Nim", () => {
  it("starts with three piles and the first seat to move", () => {
    const state = setup({ firstSeat: 1 });
    expect(state.piles).toEqual([3, 4, 5]);
    expect(state.turn).toBe(1);
  });

  it("allows taking any number of sticks from one pile", () => {
    const moves = legalMoves(setup(), 0);
    expect(moves).toHaveLength(12);
    expect(moves).toContainEqual({ pile: 2, count: 5 });
    expect(legalMoves(setup(), 1)).toEqual([]);
  });

  it("takes the sticks and hands over the turn", () => {
    const { state, events } = play(setup(), 0, { pile: 1, count: 3 });
    expect(state.piles).toEqual([3, 1, 5]);
    expect(state.turn).toBe(1);
    expect(state.taken).toEqual([3, 0]);
    expect(events).toEqual([{ type: "take", pile: 1, count: 3 }]);
  });

  it("turns away moves that take nothing, too many, or from a pile that isn't there", () => {
    expect(() => play(setup(), 0, { pile: 0, count: 0 })).toThrow(IllegalMoveError);
    expect(() => play(setup(), 0, { pile: 0, count: 4 })).toThrow(IllegalMoveError);
    expect(() => play(setup(), 0, { pile: 3, count: 1 })).toThrow(IllegalMoveError);
    expect(() => play(setup(), 0, { pile: 0, count: 1.5 })).toThrow(IllegalMoveError);
    expect(() => play(setup(), 1, { pile: 0, count: 1 })).toThrow(IllegalMoveError);
  });

  it("is won by whoever takes the last stick", () => {
    let state = { ...setup(), piles: [0, 0, 2] };
    state = play(state, 0, { pile: 2, count: 1 }).state;
    expect(result(state)).toBeNull();
    const done = play(state, 1, { pile: 2, count: 1 });
    expect(done.state.turn).toBeNull();
    expect(done.events).toContainEqual({ type: "gameOver", winner: 1 });
    expect(result(done.state)).toEqual({ winners: [1], scores: [1, 1] });
  });

  it("is for exactly two players", () => {
    expect(() => setup({ seats: 3 })).toThrow();
  });
});
