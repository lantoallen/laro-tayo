import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove, room } from "./bot";
import { boardFor, legalMoves, play, result, setup, type TilesState } from "./rules";

const tileAt = (q: number, r: number) => boardFor(3).hexes.findIndex((h) => h.q === q && h.r === r);

/** Positions from the middle of random games. */
function randomPositions(count: number, seats: number, rng: Rng): TilesState[] {
  const positions: TilesState[] = [];
  while (positions.length < count) {
    let state = setup({ seats });
    const length = Math.floor(rng() * 30);
    for (let i = 0; i < length && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    if (state.turn !== null) positions.push(state);
  }
  return positions;
}

function playGame(levels: BotLevel[], rng: Rng): Seat {
  let state = setup({ seats: levels.length, firstSeat: Math.floor(rng() * levels.length) });
  while (state.turn !== null) {
    state = play(state, state.turn, chooseMove(state, state.turn, { level: levels[state.turn], rng })).state;
  }
  return result(state)!.winners[0];
}

describe("room", () => {
  it("splits an empty board evenly at the start of a two-player game", () => {
    const [a, b] = room(setup());
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(0);
  });
});

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always steps somewhere legal on %s", (level) => {
    const rng = createRng(4);
    for (const seats of [2, 3, 4]) {
      for (const state of randomPositions(12, seats, rng)) {
        expect(legalMoves(state, state.turn!)).toContain(chooseMove(state, state.turn!, { level, rng }));
      }
    }
  });

  it.each<BotLevel>(["medium", "hard"])("traps a player when it can on %s", (level) => {
    const base = setup();
    const tiles = [...base.tiles];
    tiles[tileAt(1, -3)] = null;
    tiles[tileAt(-1, -2)] = null;
    const state: TilesState = { ...base, tiles, at: [tileAt(0, -1), tileAt(0, -3)] };
    expect(chooseMove(state, 0, { level, rng: createRng(1) })).toBe(tileAt(0, -2));
  });

  it("doesn't step into a dead end when there's a way out", () => {
    // Seat 0 in the middle. Every neighbour but two is gone, and one of those two leads nowhere.
    const base = setup();
    const middle = tileAt(0, 0);
    const deadEnd = tileAt(1, -1);
    const wayOut = tileAt(-1, 1);
    const tiles = base.tiles.map((tile, i) =>
      [middle, deadEnd, wayOut, tileAt(-2, 2), tileAt(-3, 3), tileAt(-2, 3), base.at[1]!, tileAt(0, -2)].includes(i)
        ? tile
        : null,
    );
    const state: TilesState = { ...base, tiles, at: [middle, base.at[1]] };
    for (const level of ["medium", "hard"] as const) {
      expect(chooseMove(state, 0, { level, rng: createRng(2) })).toBe(wayOut);
    }
  });

  it("hard beats easy most of the time", () => {
    const rng = createRng(9);
    let wins = 0;
    for (let game = 0; game < 10; game++) {
      const hardSeat = game % 2;
      const levels: BotLevel[] = hardSeat === 0 ? ["hard", "easy"] : ["easy", "hard"];
      if (playGame(levels, rng) === hardSeat) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(8);
  });

  it("medium beats easy in a four-player game more often than chance", () => {
    const rng = createRng(11);
    let wins = 0;
    for (let game = 0; game < 12; game++) {
      if (playGame(["medium", "easy", "easy", "easy"], rng) === 0) wins++;
    }
    expect(wins).toBeGreaterThan(3);
  });
});
