import { describe, expect, it } from "vitest";
import { createRng, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove, nimSum, winningMove } from "./bot";
import { legalMoves, play, result, setup } from "./rules";

function playGame(levels: [BotLevel, BotLevel], firstSeat: Seat, rng: Rng): Seat {
  let state = setup({ firstSeat });
  while (state.turn !== null) {
    const move = chooseMove(state, state.turn, { level: levels[state.turn], rng });
    expect(legalMoves(state, state.turn)).toContainEqual(move);
    state = play(state, state.turn, move).state;
  }
  return result(state)!.winners[0];
}

describe("the Nim bot", () => {
  it("finds a move that leaves the nim-sum at zero", () => {
    const state = setup();
    const move = winningMove(state)!;
    expect(nimSum(play(state, 0, move).state.piles)).toBe(0);
  });

  it("has no winning move once the nim-sum is zero", () => {
    expect(winningMove({ ...setup(), piles: [1, 2, 3] })).toBeNull();
  });

  it("always plays the winning move on hard", () => {
    const state = { ...setup(), piles: [2, 7, 4, 2] };
    const move = chooseMove(state, 0, { level: "hard", rng: createRng(1) });
    expect(nimSum(play(state, 0, move).state.piles)).toBe(0);
  });

  it("takes the last stick when one is left", () => {
    const state = { ...setup(), piles: [0, 1, 0] };
    expect(chooseMove(state, 0, { level: "hard", rng: createRng(1) })).toEqual({ pile: 1, count: 1 });
  });

  it("wins more games the higher its level, and hard wins every game it starts", () => {
    const record = (strong: BotLevel, weak: BotLevel, firstOnly = false) => {
      const rng = createRng(11);
      let wins = 0;
      for (let game = 0; game < 300; game++) {
        const strongSeat: Seat = game % 2;
        const levels: [BotLevel, BotLevel] = strongSeat === 0 ? [strong, weak] : [weak, strong];
        const first = firstOnly ? strongSeat : ((game >> 1) % 2 === 0 ? 0 : 1);
        if (playGame(levels, first, rng) === strongSeat) wins++;
      }
      return wins;
    };
    expect(record("medium", "easy")).toBeGreaterThan(190);
    expect(record("hard", "easy")).toBeGreaterThan(240);
    expect(record("hard", "hard", true)).toBe(300);
  });
});
