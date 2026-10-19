import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove, searchBestMoves } from "./bot";
import { SQUARES, legalMoves, play, result, setup, type DamaMove, type DamaState, type Piece } from "./rules";

const sq = (row: number, col: number) => row * 8 + col;

function stateWith(pieces: [number, Piece][], turn: Seat = 0): DamaState {
  const board = Array<Piece>(SQUARES).fill(0);
  for (const [square, piece] of pieces) board[square] = piece;
  return { board, turn, winner: null, quietMoves: 0, turns: 0 };
}

/** Positions from the middle of random games. */
function randomPositions(count: number, rng: Rng): DamaState[] {
  const positions: DamaState[] = [];
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

const includesMove = (moves: DamaMove[], move: DamaMove) => moves.some((m) => m.join() === move.join());

type Player = (state: DamaState, seat: Seat) => DamaMove;

function playGame(players: [Player, Player], firstSeat: Seat): Seat | null {
  let state = setup({ firstSeat });
  while (state.turn !== null) state = play(state, state.turn, players[state.turn](state, state.turn)).state;
  return result(state)!.winners[0] ?? null;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks a legal move on %s", (level) => {
    const rng = createRng(4);
    for (const state of randomPositions(level === "hard" ? 3 : 30, rng)) {
      expect(includesMove(legalMoves(state, state.turn!), chooseMove(state, state.turn!, { level, rng }))).toBe(true);
    }
  });
});

describe("searchBestMoves", () => {
  it("crowns a man when it can, rather than making a plain move", () => {
    const state = stateWith([
      [sq(1, 2), 1],
      [sq(6, 1), 1],
      [sq(0, 7), -1],
    ]);
    const { moves } = searchBestMoves(state, 0, { depth: 2 });
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((move) => move[0] === sq(1, 2) && move[1] < 8)).toBe(true);
  });

  it("doesn't step into a capture", () => {
    // Moving to (4, 3) would let the man at (3, 4) jump it. Moving to (4, 1) is safe.
    const state = stateWith([
      [sq(5, 2), 1],
      [sq(3, 4), -1],
      [sq(0, 1), -1],
    ]);
    expect(searchBestMoves(state, 0, { depth: 3 }).moves).toEqual([[sq(5, 2), sq(4, 1)]]);
  });

  it("returns the deepest finished search when time runs out", () => {
    let time = 0;
    const found = searchBestMoves(setup(), 0, { depth: 12, timeLimitMs: 20, now: () => (time += 1) });
    expect(found.depth).toBeLessThan(12);
    expect(found.moves.length).toBeGreaterThan(0);
  });

  it("beats the easy bot almost every game when looking 4 moves ahead", () => {
    const rng = createRng(9);
    const strong: Player = (state, seat) => pick(rng, searchBestMoves(state, seat, { depth: 4 }).moves);
    const easy: Player = (state, seat) => chooseMove(state, seat, { level: "easy", rng });
    let wins = 0;
    for (let game = 0; game < 10; game++) {
      const strongSeat: Seat = game % 2;
      if (playGame(strongSeat === 0 ? [strong, easy] : [easy, strong], game % 4 < 2 ? 0 : 1) === strongSeat) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(8);
  });
});
