import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { bestMoves, chooseMove } from "./bot";
import { legalMoves, play, result, setup, type TicTacToeState } from "./rules";

function marks(cells: number[]): TicTacToeState {
  let state = setup();
  for (const cell of cells) state = play(state, state.turn!, cell).state;
  return state;
}

describe("the Tic-Tac-Toe bot", () => {
  it("takes a win", () => {
    expect(bestMoves(marks([0, 3, 1, 4]), 0, { depth: 1 }).moves).toEqual([2]);
  });

  it("blocks a win on medium", () => {
    expect(chooseMove(marks([0, 4, 1]), 1, { level: "medium", rng: () => 0.5 })).toBe(2);
  });

  it.each<BotLevel>(["easy", "medium", "hard"])("always picks an open cell on %s", (level) => {
    const rng = createRng(2);
    for (let game = 0; game < 30; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) {
        const move = chooseMove(state, state.turn, { level, rng });
        expect(legalMoves(state, state.turn)).toContain(move);
        state = play(state, state.turn, move).state;
      }
    }
  });

  it("never loses on hard", () => {
    const rng = createRng(3);
    for (let game = 0; game < 200; game++) {
      const hardSeat: Seat = game % 2;
      let state = setup({ firstSeat: (game >> 1) % 2 });
      while (state.turn !== null) {
        const move =
          state.turn === hardSeat
            ? chooseMove(state, state.turn, { level: "hard", rng })
            : pick(rng, legalMoves(state, state.turn));
        state = play(state, state.turn, move).state;
      }
      expect(result(state)!.winners).not.toContain(1 - hardSeat);
    }
  });
});
