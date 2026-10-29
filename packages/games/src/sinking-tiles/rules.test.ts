import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import { boardFor, legalMoves, openSteps, play, result, setup, type TilesState } from "./rules";

/** The index of the tile at (q, r) on a board with `radius` rings. */
const tileAt = (q: number, r: number, radius = 3) => boardFor(radius).hexes.findIndex((h) => h.q === q && h.r === r);

describe("the board", () => {
  it("has 37 tiles for two players and 61 for more", () => {
    expect(setup({ seats: 2 }).tiles).toHaveLength(37);
    expect(setup({ seats: 3 }).tiles).toHaveLength(61);
    expect(setup({ seats: 4 }).tiles).toHaveLength(61);
  });

  it("gives the middle tile six neighbours and a corner three", () => {
    const { neighbours } = boardFor(3);
    expect(neighbours[tileAt(0, 0)]).toHaveLength(6);
    expect(neighbours[tileAt(0, 3)]).toHaveLength(3);
    expect(neighbours[tileAt(1, 0)]).toContain(tileAt(0, 0));
  });
});

describe("setup", () => {
  it.each([2, 3, 4])("starts %i players on different corners, each tile already cracked", (seats) => {
    const state = setup({ seats });
    const { neighbours } = boardFor(state.radius);
    expect(new Set(state.at).size).toBe(seats);
    for (const tile of state.at) {
      expect(neighbours[tile!]).toHaveLength(3);
      expect(state.tiles[tile!]).toBe(1);
    }
    expect(state.tiles.filter((tile) => tile === 0)).toHaveLength(state.tiles.length - seats);
  });

  it("puts seat 0 at the bottom corner in a two-player game", () => {
    expect(setup().at).toEqual([tileAt(0, 3), tileAt(0, -3)]);
  });

  it("refuses 1 or 5 players", () => {
    expect(() => setup({ seats: 1 })).toThrow();
    expect(() => setup({ seats: 5 })).toThrow();
  });
});

describe("play", () => {
  it("lets a player step only onto an open tile next to them, on their turn", () => {
    const state = setup();
    expect(legalMoves(state, 0).sort()).toEqual([tileAt(1, 2), tileAt(-1, 3), tileAt(0, 2)].sort());
    expect(legalMoves(state, 1)).toEqual([]);
    expect(() => play(state, 1, tileAt(0, -2))).toThrow(IllegalMoveError);
    expect(() => play(state, 0, tileAt(0, 0))).toThrow(IllegalMoveError);
  });

  it("cracks a whole tile, and sinks a tile once someone steps off it the second time", () => {
    const start = tileAt(0, 3);
    let state = play(setup(), 0, tileAt(0, 2)).state;
    expect(state.tiles[tileAt(0, 2)]).toBe(1);
    // The starting tile was only stepped on once, so it's still there.
    expect(state.tiles[start]).toBe(1);
    expect(state.turn).toBe(1);

    state = play(state, 1, tileAt(0, -2)).state;
    state = play(state, 0, start).state;
    expect(state.tiles[start]).toBe(2);
    state = play(state, 1, tileAt(0, -1)).state;
    const outcome = play(state, 0, tileAt(1, 2));
    expect(outcome.state.tiles[start]).toBeNull();
    expect(outcome.events).toContainEqual({ type: "sink", tile: start });
    expect(outcome.state.last).toMatchObject({ seat: 0, from: start, to: tileAt(1, 2), sank: true, fell: [] });
  });

  it("drops a player with nowhere to step, and the last one standing wins", () => {
    const base = setup();
    const tiles = [...base.tiles];
    tiles[tileAt(1, -3)] = null;
    tiles[tileAt(-1, -2)] = null;
    const state: TilesState = { ...base, tiles, at: [tileAt(0, -1), tileAt(0, -3)] };

    const outcome = play(state, 0, tileAt(0, -2));
    expect(outcome.events).toContainEqual({ type: "fall", seat: 1, tile: tileAt(0, -3) });
    expect(outcome.events.at(-1)).toEqual({ type: "gameOver", winners: [0] });
    expect(outcome.state.turn).toBeNull();
    expect(outcome.state.tiles[tileAt(0, -3)]).toBeNull();
    expect(result(outcome.state)).toEqual({ winners: [0], scores: [1, 0] });
  });

  it("skips a player who fell in and carries on with the rest", () => {
    const base = setup({ seats: 3 });
    const tiles = [...base.tiles];
    const corner = base.at[1]!;
    const [first, ...rest] = boardFor(4).neighbours[corner];
    for (const tile of rest) tiles[tile] = null;
    // Seat 2 stands on the only tile left next to seat 1.
    const trapped: TilesState = { ...base, tiles, at: [base.at[0], corner, first] };

    const outcome = play(trapped, 0, legalMoves(trapped, 0)[0]);
    expect(outcome.state.at[1]).toBeNull();
    expect(outcome.state.out).toEqual([1]);
    expect(outcome.state.turn).toBe(2);
    expect(result(outcome.state)).toBeNull();
    expect(openSteps(outcome.state, 1)).toBe(0);
  });

  it.each([2, 3, 4])("always ends with one winner, with %i players taking random steps", (seats) => {
    const rng = createRng(seats);
    for (let game = 0; game < 40; game++) {
      let state = setup({ seats, firstSeat: game % seats });
      let moves = 0;
      while (state.turn !== null) {
        state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
        moves++;
        expect(moves).toBeLessThanOrEqual(state.tiles.length * 2);
      }
      const outcome = result(state)!;
      expect(outcome.winners).toHaveLength(1);
      expect(state.out).toHaveLength(seats - 1);
      expect([...outcome.scores].sort()).toEqual(Array.from({ length: seats }, (_, i) => i));
      expect(outcome.scores[outcome.winners[0]]).toBe(seats - 1);
    }
  });
});
