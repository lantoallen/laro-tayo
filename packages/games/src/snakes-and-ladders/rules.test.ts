import { describe, expect, it } from "vitest";
import { createRng, rollDie } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import { LADDERS, LAST_SQUARE, SNAKES, play, result, setup, type SnakesMove, type SnakesState } from "./rules";

/** A seed whose next roll is `roll`. */
function seedFor(roll: number): number {
  for (let seed = 0; ; seed++) if (rollDie(seed).roll === roll) return seed;
}

function at(position: number, roll: number): SnakesState {
  return { ...setup(), positions: [position, 0], seed: seedFor(roll) };
}

describe("Snakes and Ladders", () => {
  it("starts both players off the board", () => {
    const state = setup({ firstSeat: 1, rng: createRng(1) });
    expect(state.positions).toEqual([0, 0]);
    expect(state.turn).toBe(1);
  });

  it("moves by the roll and passes the turn", () => {
    const { state, events } = play(at(10, 4), 0, "roll");
    expect(state.positions[0]).toBe(14);
    expect(state.turn).toBe(1);
    expect(events).toEqual([
      { type: "roll", roll: 4 },
      { type: "move", from: 10, to: 14 },
    ]);
  });

  it("climbs a ladder and slides down a snake", () => {
    const up = play(at(26, 2), 0, "roll").state;
    expect(up.last).toEqual({ seat: 0, roll: 2, from: 26, landed: 28, to: LADDERS[28], jump: "ladder" });
    const down = play(at(85, 2), 0, "roll").state;
    expect(down.positions[0]).toBe(SNAKES[87]);
    expect(down.last?.jump).toBe("snake");
  });

  it("doesn't move on a roll that would pass the last square", () => {
    const state = play(at(97, 5), 0, "roll").state;
    expect(state.positions[0]).toBe(97);
    expect(state.turn).toBe(1);
  });

  it("wins on landing exactly on the last square", () => {
    const state = play(at(96, 4), 0, "roll").state;
    expect(state.positions[0]).toBe(LAST_SQUARE);
    expect(state.turn).toBeNull();
    expect(result(state)).toEqual({ winners: [0], scores: [100, 0] });
  });

  it("turns down anything but a roll, and rolls out of turn", () => {
    expect(() => play(setup(), 0, "move" as SnakesMove)).toThrow(IllegalMoveError);
    expect(() => play(setup(), 1, "roll")).toThrow(IllegalMoveError);
  });

  it("never puts anyone on a snake's head or a ladder's foot", () => {
    for (const square of [...Object.keys(LADDERS), ...Object.keys(SNAKES)].map(Number)) {
      expect(Object.values(LADDERS)).not.toContain(square);
      expect(Object.values(SNAKES)).not.toContain(square);
    }
  });

  it("always ends", () => {
    const rng = createRng(2);
    for (let game = 0; game < 300; game++) {
      let state = setup({ firstSeat: game % 2, rng });
      while (state.turn !== null) {
        state = play(state, state.turn, "roll").state;
        expect(state.turns).toBeLessThan(2000);
      }
      expect(state.positions).toContain(LAST_SQUARE);
    }
  });
});
