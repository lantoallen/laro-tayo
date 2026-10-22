import { describe, expect, it } from "vitest";
import { createRng, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup } from "./rules";

function playGame(levels: [BotLevel, BotLevel], firstSeat: Seat, rng: Rng): Seat {
  let state = setup({ firstSeat, rng });
  while (state.turn !== null) {
    const move = chooseMove(state, state.turn, { level: levels[state.turn], rng });
    expect(legalMoves(state, state.turn)).toContain(move);
    state = play(state, state.turn, move).state;
  }
  return result(state)!.winners[0];
}

describe("the Pig bot", () => {
  it("rolls when it has nothing to bank", () => {
    expect(chooseMove(setup(), 0, { level: "hard", rng: Math.random })).toBe("roll");
  });

  it("banks at 20 on medium", () => {
    const state = { ...setup(), turnTotal: 20 };
    expect(chooseMove(state, 0, { level: "medium", rng: Math.random })).toBe("hold");
    expect(chooseMove({ ...state, turnTotal: 19 }, 0, { level: "medium", rng: Math.random })).toBe("roll");
  });

  it("keeps rolling on hard when the other player is about to win", () => {
    const state = { ...setup(), scores: [40, 92] as [number, number], turnTotal: 30 };
    expect(chooseMove(state, 0, { level: "hard", rng: Math.random })).toBe("roll");
  });

  it("wins more games the higher its level", () => {
    const record = (strong: BotLevel, weak: BotLevel) => {
      const rng = createRng(7);
      let wins = 0;
      for (let game = 0; game < 400; game++) {
        const strongSeat: Seat = game % 2;
        const levels: [BotLevel, BotLevel] = strongSeat === 0 ? [strong, weak] : [weak, strong];
        if (playGame(levels, (game >> 1) % 2 === 0 ? 0 : 1, rng) === strongSeat) wins++;
      }
      return wins;
    };
    expect(record("medium", "easy")).toBeGreaterThan(220);
    expect(record("hard", "easy")).toBeGreaterThan(220);
  });
});

describe("the Pig bot with more players", () => {
  it("keeps rolling on hard when anyone else is about to win", () => {
    const state = { ...setup({ seats: 4 }), scores: [40, 10, 95, 20], turnTotal: 30 };
    expect(chooseMove(state, 0, { level: "hard", rng: Math.random })).toBe("roll");
  });
});
