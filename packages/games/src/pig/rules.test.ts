import { describe, expect, it } from "vitest";
import { createRng, pick, rollDie } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import { GOAL, legalMoves, play, result, setup, view, type PigMove, type PigState } from "./rules";

/** A seed whose next roll is `roll`. */
function seedFor(roll: number): number {
  for (let seed = 0; ; seed++) if (rollDie(seed).roll === roll) return seed;
}

const withRoll = (state: PigState, roll: number): PigState => ({ ...state, seed: seedFor(roll) });

describe("Pig", () => {
  it("starts at zero, and you have to roll before you can hold", () => {
    const state = setup({ firstSeat: 1, rng: createRng(1) });
    expect(state.scores).toEqual([0, 0]);
    expect(legalMoves(state, 1)).toEqual(["roll"]);
    expect(() => play(state, 1, "hold")).toThrow(IllegalMoveError);
  });

  it("adds a roll to the turn's points and keeps the turn", () => {
    const state = play(withRoll(setup(), 5), 0, "roll").state;
    expect(state.turnTotal).toBe(5);
    expect(state.turn).toBe(0);
    expect(legalMoves(state, 0)).toEqual(["roll", "hold"]);
  });

  it("banks the points on a hold and passes the turn", () => {
    const rolled = play(withRoll(setup(), 6), 0, "roll").state;
    const { state, events } = play(rolled, 0, "hold");
    expect(state.scores).toEqual([6, 0]);
    expect(state.turnTotal).toBe(0);
    expect(state.turn).toBe(1);
    expect(events).toEqual([{ type: "hold", banked: 6 }]);
  });

  it("loses the turn's points on a 1", () => {
    const rolled = play(withRoll(setup(), 6), 0, "roll").state;
    const state = play(withRoll(rolled, 1), 0, "roll").state;
    expect(state.turnTotal).toBe(0);
    expect(state.scores).toEqual([0, 0]);
    expect(state.turn).toBe(1);
    expect(state.last).toEqual({ seat: 0, action: "roll", roll: 1, bust: true, banked: 0, lost: 6 });
  });

  it("wins as soon as the points reach the goal", () => {
    const state = play(withRoll({ ...setup(), scores: [GOAL - 3, 50] }, 4), 0, "roll").state;
    expect(state.turn).toBeNull();
    expect(result(state)).toEqual({ winners: [0], scores: [GOAL + 1, 50] });
  });

  it("hides the seed from players", () => {
    expect(view(setup({ rng: createRng(3) })).seed).toBe(0);
  });

  it("turns down a move that isn't roll or hold", () => {
    expect(() => play(setup(), 0, "pass" as PigMove)).toThrow(IllegalMoveError);
  });

  it("always ends", () => {
    const rng = createRng(4);
    for (let game = 0; game < 200; game++) {
      let state = setup({ firstSeat: game % 2, rng });
      while (state.turn !== null) {
        state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
        expect(state.turns).toBeLessThan(5000);
      }
      expect(Math.max(...state.scores)).toBeGreaterThanOrEqual(GOAL);
    }
  });
});

describe("Pig with more players", () => {
  it("passes the die around a table of up to four", () => {
    let state = setup({ seats: 3, firstSeat: 1, rng: createRng(5) });
    expect(state.scores).toEqual([0, 0, 0]);
    state = play(withRoll(state, 4), 1, "roll").state;
    state = play(state, 1, "hold").state;
    expect(state.turn).toBe(2);
    expect(state.scores).toEqual([0, 4, 0]);
    state = play(withRoll(state, 1), 2, "roll").state;
    expect(state.turn).toBe(0);
  });

  it.each([1, 5])("turns down %s players", (seats) => {
    expect(() => setup({ seats })).toThrow();
  });
});
