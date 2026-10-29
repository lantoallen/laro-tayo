import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import { boardFor, legalMoves, movers, openSteps, play, result, setup, timeOut, view, type TilesState } from "./rules";

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
    expect(outcome.state.last).toEqual({
      steps: [{ seat: 0, from: start, to: tileAt(1, 2) }],
      bumps: [],
      sank: [start],
      fell: [],
    });
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

describe("moving all at once", () => {
  /** Two players next to the middle tile, with every other tile but theirs sunk unless `keep` says so. */
  function aroundTheMiddle(keep: number[] = [], middle: 0 | 1 = 0): TilesState {
    const base = setup({ mode: "together" });
    const a = tileAt(-1, 0);
    const b = tileAt(1, -1);
    const centre = tileAt(0, 0);
    const tiles = base.tiles.map((_, i) =>
      i === a || i === b ? 1 : i === centre ? middle : keep.includes(i) ? 0 : null,
    );
    return { ...base, tiles, at: [a, b] };
  }

  it("lets everyone pick, in any order, and keeps picks hidden from the others", () => {
    const state = setup({ seats: 3, mode: "together" });
    expect(movers(state)).toEqual([0, 1, 2]);
    const picked = play(state, 2, legalMoves(state, 2)[0]).state;
    expect(movers(picked)).toEqual([0, 1]);
    expect(picked.turn).toBe(0);
    expect(legalMoves(picked, 2)).toEqual([]);
    expect(() => play(picked, 2, legalMoves(state, 2)[1])).toThrow(IllegalMoveError);
    expect(view(picked, 0).picks).toEqual([null, null, "hidden"]);
    expect(view(picked, 2).picks).toEqual([null, null, legalMoves(state, 2)[0]]);
    expect(view(picked, null).picks).toEqual([null, null, "hidden"]);
  });

  it("moves everyone at once when the last pick is in", () => {
    let state = setup({ mode: "together" });
    const [a, b] = [legalMoves(state, 0)[0], legalMoves(state, 1)[0]];
    state = play(state, 1, b).state;
    const outcome = play(state, 0, a);
    expect(outcome.state.at).toEqual([a, b]);
    expect(outcome.state.round).toBe(1);
    expect(outcome.state.picks).toEqual([null, null]);
    expect(movers(outcome.state)).toEqual([0, 1]);
    expect(outcome.state.last!.steps).toHaveLength(2);
    expect(outcome.events.filter((event) => event.type === "step")).toHaveLength(2);
  });

  it("bumps players who pick the same tile: they stay put and the tile cracks", () => {
    const centre = tileAt(0, 0);
    const state = aroundTheMiddle([tileAt(-2, 0), tileAt(2, -2)]);
    const outcome = play(play(state, 0, centre).state, 1, centre);
    expect(outcome.state.at).toEqual(state.at);
    expect(outcome.state.tiles[centre]).toBe(1);
    expect(outcome.state.last!.bumps).toEqual([{ tile: centre, seats: [0, 1] }]);
    expect(outcome.events).toContainEqual({ type: "bump", tile: centre, seats: [0, 1] });
    expect(result(outcome.state)).toBeNull();
  });

  it("sinks a cracked tile that two players bump on, and lets players who fall in together share the win", () => {
    const centre = tileAt(0, 0);
    const state = aroundTheMiddle([], 1);
    const outcome = play(play(state, 1, centre).state, 0, centre);
    expect(outcome.state.tiles[centre]).toBeNull();
    expect(outcome.state.last!.sank).toEqual([centre]);
    expect(outcome.state.at).toEqual([null, null]);
    expect(outcome.state.turn).toBeNull();
    expect(result(outcome.state)).toEqual({ winners: [0, 1], scores: [1, 1] });
  });

  it("steps everyone who hasn't picked somewhere at random when time runs out", () => {
    let state = setup({ seats: 4, mode: "together" });
    state = play(state, 1, legalMoves(state, 1)[0]).state;
    const outcome = timeOut(state, createRng(3));
    expect(outcome.state.round).toBe(1);
    expect(outcome.state.last!.steps.length + 2 * outcome.state.last!.bumps.length).toBeGreaterThanOrEqual(3);
    expect(movers(outcome.state)).toEqual([0, 1, 2, 3]);
  });

  it.each([2, 3, 4])("always ends, with %i players picking at random", (seats) => {
    const rng = createRng(10 + seats);
    for (let game = 0; game < 30; game++) {
      let state = setup({ seats, mode: "together" });
      while (state.turn !== null) {
        expect(state.round).toBeLessThanOrEqual(state.tiles.length * 2);
        state = timeOut(state, rng).state;
      }
      const outcome = result(state)!;
      expect(outcome.winners.length).toBeGreaterThanOrEqual(1);
      for (const seat of outcome.winners) expect(outcome.scores[seat]).toBe(seats - 1);
    }
  });
});
