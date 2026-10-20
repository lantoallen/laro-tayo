import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { bestMoves, chooseMove } from "./bot";
import { legalMoves, play, result, setup, type FourMove, type FourState } from "./rules";

function drops(columns: number[], state: FourState = setup()): FourState {
  for (const column of columns) state = play(state, state.turn!, column).state;
  return state;
}

type Player = (state: FourState, seat: Seat) => FourMove;

function playGame(players: [Player, Player], firstSeat: Seat): Seat | null {
  let state = setup({ firstSeat });
  while (state.turn !== null) state = play(state, state.turn, players[state.turn](state, state.turn)).state;
  return result(state)!.winners[0] ?? null;
}

/** Positions from the middle of random games. */
function randomPositions(count: number, rng: Rng): FourState[] {
  const positions: FourState[] = [];
  while (positions.length < count) {
    let state = setup({ firstSeat: positions.length % 2 });
    const length = Math.floor(rng() * 30);
    for (let i = 0; i < length && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    if (state.turn !== null) positions.push(state);
  }
  return positions;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks a legal move on %s", (level) => {
    const rng = createRng(3);
    for (const state of randomPositions(level === "hard" ? 4 : 30, rng)) {
      expect(legalMoves(state, state.turn!)).toContain(chooseMove(state, state.turn!, { level, rng }));
    }
  });
});

describe("bestMoves", () => {
  it("takes a win when it has one", () => {
    // Seat 0 has three across the bottom with both ends open.
    const state = drops([1, 1, 2, 2, 3, 3]);
    expect(bestMoves(state, 0, { depth: 1 }).moves.sort()).toEqual([0, 4]);
  });

  it("blocks a win it can see coming", () => {
    // Seat 1 has three up column 6 and seat 0 is to move.
    const state = drops([0, 6, 1, 6, 0, 6]);
    expect(bestMoves(state, 0, { depth: 2 }).moves).toEqual([6]);
  });

  it("returns the deepest finished search when time runs out", () => {
    let time = 0;
    const found = bestMoves(setup(), 0, { depth: 16, timeLimitMs: 30, now: () => (time += 1) });
    expect(found.depth).toBeLessThan(16);
    expect(found.moves.length).toBeGreaterThan(0);
  });

  it("beats the easy bot almost every game when looking 4 moves ahead", () => {
    const rng = createRng(5);
    const strong: Player = (state, seat) => pick(rng, bestMoves(state, seat, { depth: 4 }).moves);
    const easy: Player = (state, seat) => chooseMove(state, seat, { level: "easy", rng });
    let wins = 0;
    for (let game = 0; game < 10; game++) {
      const strongSeat: Seat = game % 2;
      if (playGame(strongSeat === 0 ? [strong, easy] : [easy, strong], game % 4 < 2 ? 0 : 1) === strongSeat) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(9);
  });
});
