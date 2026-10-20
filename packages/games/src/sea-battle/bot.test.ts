import { describe, expect, it } from "vitest";
import { createRng, type Rng } from "../engine/rng";
import type { BotLevel } from "../engine/types";
import { chooseMove } from "./bot";
import { isSunk, legalMoves, play, randomFleet, setup, type SeaState } from "./rules";

/** Shots it takes seat 0 to sink a fleet on its own, with seat 1 never firing back. */
function shotsToWin(level: BotLevel, rng: Rng): number {
  let state = setup({ rng });
  let shots = 0;
  while (state.turn !== null) {
    state = play(state, 0, chooseMove(state, 0, { level, rng })).state;
    shots++;
    if (state.turn !== null) state = { ...state, turn: 0 };
  }
  return shots;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always fires at a new cell on %s", (level) => {
    const rng = createRng(1);
    let state: SeaState = setup({ rng });
    while (state.turn !== null) {
      const move = chooseMove(state, state.turn, { level, rng });
      expect(legalMoves(state, state.turn)).toContain(move);
      state = play(state, state.turn, move).state;
    }
  });

  it("never looks at ships it hasn't sunk", () => {
    const rng = createRng(2);
    for (let game = 0; game < 20; game++) {
      let state = setup({ rng });
      for (let i = 0; i < 20; i++) state = play(state, state.turn!, legalMoves(state, state.turn!)[i * 3]).state;
      if (state.fleets[1].some((ship) => isSunk(ship, state.shots[0]))) continue;
      // Moving seat 1's ships somewhere else changes nothing seat 0 can see, so it shouldn't change the shot.
      const moved: SeaState = { ...state, fleets: [state.fleets[0], randomFleet(rng)] };
      for (const level of ["easy", "medium", "hard"] as const) {
        expect(chooseMove(moved, 0, { level, rng: createRng(game) })).toBe(
          chooseMove(state, 0, { level, rng: createRng(game) }),
        );
      }
    }
  });

  it("sinks a fleet in fewer shots the higher its level", () => {
    const average = (level: BotLevel) => {
      const rng = createRng(3);
      let total = 0;
      for (let game = 0; game < 30; game++) total += shotsToWin(level, rng);
      return total / 30;
    };
    const [easy, medium, hard] = [average("easy"), average("medium"), average("hard")];
    expect(medium).toBeLessThan(easy);
    expect(hard).toBeLessThan(medium);
  });
});
