import { describe, expect, it } from "vitest";
import { createRng } from "../engine/rng";
import type { BotLevel } from "../engine/types";
import { chooseMove } from "./bot";
import { CHOICES, play, setup, type JakState } from "./rules";

describe("the Jak-en-poy bot", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks rock, paper, or scissors on %s", (level) => {
    const rng = createRng(1);
    let state: JakState = setup();
    while (state.turn !== null) {
      const move = chooseMove(state, state.turn, { level, rng });
      expect(CHOICES).toContain(move);
      state = play(state, state.turn, move).state;
    }
  });

  it("never sees the pick made before it in the same round", () => {
    const rock = play(setup(), 0, "rock").state;
    const paper = play(setup(), 0, "paper").state;
    for (let seed = 0; seed < 20; seed++) {
      expect(chooseMove(rock, 1, { level: "hard", rng: createRng(seed) })).toBe(
        chooseMove(paper, 1, { level: "hard", rng: createRng(seed) }),
      );
    }
  });

  it("beats someone who always plays rock on hard", () => {
    const rng = createRng(2);
    let wins = 0;
    let losses = 0;
    for (let game = 0; game < 50; game++) {
      let state = setup();
      while (state.turn !== null) {
        const move = state.turn === 0 ? "rock" : chooseMove(state, 1, { level: "hard", rng });
        state = play(state, state.turn, move).state;
      }
      if (state.winner === 1) wins++;
      else losses++;
    }
    expect(wins).toBeGreaterThan(losses * 3);
  });
});
