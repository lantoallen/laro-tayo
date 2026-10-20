import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { bestMoves, chooseMove } from "./bot";
import { legalMoves, play, result, setup, type Disc, type ReversiMove, type ReversiState } from "./rules";

/** Positions from the middle of random games. */
function randomPositions(count: number, rng: Rng): ReversiState[] {
  const positions: ReversiState[] = [];
  while (positions.length < count) {
    let state = setup({ firstSeat: positions.length % 2 });
    const length = Math.floor(rng() * 50);
    for (let i = 0; i < length && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    if (state.turn !== null) positions.push(state);
  }
  return positions;
}

type Player = (state: ReversiState, seat: Seat) => ReversiMove;

function playGame(players: [Player, Player], firstSeat: Seat): Seat | null {
  let state = setup({ firstSeat });
  while (state.turn !== null) state = play(state, state.turn, players[state.turn](state, state.turn)).state;
  return result(state)!.winners[0] ?? null;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks a legal move on %s", (level) => {
    const rng = createRng(6);
    for (const state of randomPositions(level === "hard" ? 3 : 25, rng)) {
      expect(legalMoves(state, state.turn!)).toContain(chooseMove(state, state.turn!, { level, rng }));
    }
  });
});

describe("bestMoves", () => {
  it("takes a corner when it can", () => {
    const board = setup().board;
    // Black can take the top left corner by trapping the white disc next to it.
    board[1] = 1 as Disc;
    board[2] = 0 as Disc;
    const state: ReversiState = { board, turn: 0, last: null, passed: null, turns: 0 };
    expect(bestMoves(state, 0, { depth: 2 }).moves).toEqual([0]);
  });

  it("returns the deepest finished search when time runs out", () => {
    let time = 0;
    const found = bestMoves(setup(), 0, { depth: 14, timeLimitMs: 30, now: () => (time += 1) });
    expect(found.depth).toBeLessThan(14);
    expect(found.moves.length).toBeGreaterThan(0);
  });

  it("beats the easy bot almost every game when looking 2 moves ahead", () => {
    const rng = createRng(8);
    const strong: Player = (state, seat) => pick(rng, bestMoves(state, seat, { depth: 2 }).moves);
    const easy: Player = (state, seat) => chooseMove(state, seat, { level: "easy", rng });
    let wins = 0;
    for (let game = 0; game < 10; game++) {
      const strongSeat: Seat = game % 2;
      if (playGame(strongSeat === 0 ? [strong, easy] : [easy, strong], game % 4 < 2 ? 0 : 1) === strongSeat) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(8);
  });
});
