import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, setup, type PusoyMove, type PusoyState } from "./rules";

const sameMove = (a: PusoyMove, b: PusoyMove) => a.join() === b.join();

/** Plays a game where each seat uses its own bot level, and returns the winner. */
function playGame(levels: BotLevel[], seed: number): Seat {
  const rng = createRng(seed);
  let state = setup({ rng });
  while (state.turn !== null) {
    state = play(state, state.turn, chooseMove(state, state.turn, { level: levels[state.turn], rng })).state;
  }
  return state.winner!;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks a legal move on %s", (level) => {
    const rng = createRng(5);
    for (let game = 0; game < 10; game++) {
      let state = setup({ rng });
      while (state.turn !== null) {
        const move = chooseMove(state, state.turn, { level, rng });
        expect(legalMoves(state, state.turn).some((legal) => sameMove(legal, move))).toBe(true);
        state = play(state, state.turn, move).state;
      }
    }
  });

  it("never looks at anyone else's cards", () => {
    const rng = createRng(6);
    let state = setup({ rng });
    for (let i = 0; i < 6 && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    const seat = state.turn!;
    // Swap the other players' cards around. The bot should choose exactly the same move.
    const others = state.hands.filter((_, i) => i !== seat);
    const shuffled = [others[1], others[2], others[0]];
    let k = 0;
    const scrambled: PusoyState = {
      ...state,
      hands: state.hands.map((hand, i) => (i === seat ? hand : shuffled[k++].slice(0, hand.length))),
    };
    for (const level of ["medium", "hard"] as const) {
      const a = chooseMove(state, seat, { level, rng: createRng(1) });
      const b = chooseMove(scrambled, seat, { level, rng: createRng(1) });
      expect(b).toEqual(a);
    }
  });

  it("starts a round with the most cards it can shed, and plays the 3 of clubs first", () => {
    const state: PusoyState = {
      hands: [[0, 5, 9, 13, 17, 30], [20], [21], [22]],
      turn: 0,
      table: null,
      passes: 0,
      opening: 0,
      winner: null,
      turns: 0,
    };
    const move = chooseMove(state, 0, { level: "medium", rng: () => 0.5 });
    expect(move).toContain(0);
    expect(move).toHaveLength(5);
  });

  it("wins more often on hard than the easy bots it plays against", () => {
    let wins = 0;
    for (let game = 0; game < 60; game++) {
      if (playGame(["hard", "easy", "easy", "easy"], 100 + game) === 0) wins++;
    }
    // Four players means a fair share is a quarter of the games.
    expect(wins).toBeGreaterThan(25);
  });
});
