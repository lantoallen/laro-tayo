import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { bestMoves, chooseMove } from "./bot";
import { POINTS, legalMoves, play, result, setup, type MorrisMove, type MorrisState } from "./rules";

function stateWith(red: number[], blue: number[], turn: Seat, inHand: [number, number]): MorrisState {
  const board = Array.from({ length: POINTS }, (_, point) =>
    red.includes(point) ? 0 : blue.includes(point) ? 1 : null,
  );
  return { ...setup(), board, inHand, turn };
}

/** Positions from the middle of random games, including ones where a piece is about to be taken. */
function randomPositions(count: number, rng: Rng): MorrisState[] {
  const positions: MorrisState[] = [];
  while (positions.length < count) {
    let state = setup({ firstSeat: positions.length % 2 });
    const length = Math.floor(rng() * 60);
    for (let i = 0; i < length && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    if (state.turn !== null) positions.push(state);
  }
  return positions;
}

type Player = (state: MorrisState, seat: Seat) => MorrisMove;

function playGame(players: [Player, Player], firstSeat: Seat): Seat | null {
  let state = setup({ firstSeat });
  while (state.turn !== null) state = play(state, state.turn, players[state.turn](state, state.turn)).state;
  return result(state)!.winners[0] ?? null;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks a legal move on %s", (level) => {
    const rng = createRng(3);
    for (const state of randomPositions(level === "hard" ? 4 : 30, rng)) {
      expect(legalMoves(state, state.turn!)).toContainEqual(chooseMove(state, state.turn!, { level, rng }));
    }
  });
});

describe("bestMoves", () => {
  it("makes a mill when it can", () => {
    const state = stateWith([0, 1], [10, 15], 0, [5, 5]);
    expect(bestMoves(state, 0, { depth: 1 }).moves).toEqual([{ place: 2 }]);
  });

  it("blocks a mill it can see coming", () => {
    const state = stateWith([3], [21, 22], 0, [6, 6]);
    expect(bestMoves(state, 0, { depth: 2 }).moves).toEqual([{ place: 23 }]);
  });

  it("beats the easy bot almost every game when looking 2 moves ahead", () => {
    const rng = createRng(5);
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
