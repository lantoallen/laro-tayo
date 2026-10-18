import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove, searchBestMoves } from "./bot";
import { BOARD_SIZE, legalMoves, play, result, setup, type SungkaState } from "./rules";

function stateWith(slots: Record<number, number>, turn: Seat = 0): SungkaState {
  const board = Array<number>(BOARD_SIZE).fill(0);
  for (const [slot, count] of Object.entries(slots)) board[Number(slot)] = count;
  return { board, turn, turns: 0 };
}

/** Positions from the middle of random games. */
function randomPositions(count: number, rng: Rng): SungkaState[] {
  const positions: SungkaState[] = [];
  while (positions.length < count) {
    let state = setup({ firstSeat: positions.length % 2 });
    const length = 1 + Math.floor(rng() * 30);
    for (let i = 0; i < length && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    if (state.turn !== null) positions.push(state);
  }
  return positions;
}

type Player = (state: SungkaState, seat: Seat) => number;

/** Plays a full game and returns the winning seat, or null for a draw. */
function playGame(players: [Player, Player], firstSeat: Seat): Seat | null {
  let state = setup({ firstSeat });
  while (state.turn !== null) {
    state = play(state, state.turn, players[state.turn](state, state.turn)).state;
  }
  return result(state)!.winners[0] ?? null;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium"])("always picks a legal move on %s", (level) => {
    const rng = createRng(11);
    for (const state of randomPositions(40, rng)) {
      expect(legalMoves(state, state.turn!)).toContain(chooseMove(state, state.turn!, { level, rng }));
    }
  });

  it("always picks a legal move on hard", () => {
    const rng = createRng(12);
    for (const state of randomPositions(3, rng)) {
      expect(legalMoves(state, state.turn!)).toContain(chooseMove(state, state.turn!, { level: "hard", rng }));
    }
  });

  it("plays the same move for the same seed", () => {
    const state = randomPositions(1, createRng(5))[0];
    const first = chooseMove(state, state.turn!, { level: "medium", rng: createRng(99) });
    const second = chooseMove(state, state.turn!, { level: "medium", rng: createRng(99) });
    expect(second).toBe(first);
  });
});

describe("searchBestMoves", () => {
  // House 2 lands in empty house 3 and captures the 20 shells across in house 11.
  const bigCapture = stateWith({ 0: 1, 2: 1, 9: 2, 11: 20 });

  it.each([1, 3, 6])("takes a big capture when looking %i moves ahead", (depth) => {
    expect(searchBestMoves(bigCapture, 0, { depth }).moves).toEqual([2]);
  });

  it("plans past a bonus turn", () => {
    // House 6 lands in the store for a bonus turn, then house 2 makes the same capture.
    const state = stateWith({ 2: 1, 6: 1, 9: 2, 11: 20 });
    expect(searchBestMoves(state, 0, { depth: 1 }).moves).toEqual([2]);
    expect(searchBestMoves(state, 0, { depth: 2 }).moves).toEqual([6]);
  });

  it("returns the deepest finished search when time runs out", () => {
    let time = 0;
    const found = searchBestMoves(setup(), 0, { depth: 14, timeLimitMs: 20, now: () => (time += 1) });
    expect(found.depth).toBeLessThan(14);
    expect(found.moves.length).toBeGreaterThan(0);
  });

  it("beats the easy bot almost every game when looking 5 moves ahead", () => {
    const rng = createRng(3);
    const strong: Player = (state, seat) => pick(rng, searchBestMoves(state, seat, { depth: 5 }).moves);
    const easy: Player = (state, seat) => chooseMove(state, seat, { level: "easy", rng });

    let wins = 0;
    for (let game = 0; game < 20; game++) {
      const strongSeat: Seat = game % 2;
      const players: [Player, Player] = strongSeat === 0 ? [strong, easy] : [easy, strong];
      if (playGame(players, game % 4 < 2 ? 0 : 1) === strongSeat) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(17);
  });
});
