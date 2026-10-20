import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import {
  CELLS,
  FLEET,
  around,
  isSunk,
  legalMoves,
  play,
  randomFleet,
  result,
  setup,
  shipsLeft,
  view,
  type SeaState,
} from "./rules";

/** Seat 0 fires at every cell of seat 1's ship. Seat 1 fires back in between, at the first open cell. */
function sinkShip(state: SeaState, ship: number): SeaState {
  for (const cell of state.fleets[1][ship]!) {
    if (state.turn === 1) state = play(state, 1, legalMoves(state, 1)[0]).state;
    state = play(state, 0, cell).state;
  }
  return state;
}

describe("setup", () => {
  it("places five ships of 5, 4, 3, 3, and 2 that don't overlap or touch", () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const fleet = randomFleet(rng);
      expect(fleet.map((ship) => ship.length)).toEqual([...FLEET]);
      fleet.forEach((ship, a) => {
        const near = new Set(ship.flatMap(around));
        fleet.forEach((other, b) => {
          if (a !== b) expect(other.some((cell) => near.has(cell))).toBe(false);
        });
      });
    }
  });

  it("lets the chosen player fire first at any of the 100 cells", () => {
    const state = setup({ firstSeat: 1, rng: createRng(2) });
    expect(legalMoves(state, 1)).toHaveLength(CELLS);
    expect(legalMoves(state, 0)).toEqual([]);
  });
});

describe("firing", () => {
  it("marks a hit or a miss and passes the turn either way", () => {
    const start = setup({ rng: createRng(3) });
    const target = start.fleets[1][0]![0];
    const hit = play(start, 0, target).state;
    expect(hit.shots[0][target]).toBe("hit");
    expect(hit.last).toEqual({ seat: 0, cell: target, hit: true, sunk: null });
    expect(hit.turn).toBe(1);
    const water = legalMoves(hit, 1).find((cell) => !hit.fleets[0].some((ship) => ship!.includes(cell)))!;
    expect(play(hit, 1, water).state.shots[1][water]).toBe("miss");
  });

  it("sinks a ship once every cell is hit", () => {
    const state = sinkShip(setup({ rng: createRng(4) }), 4);
    expect(isSunk(state.fleets[1][4], state.shots[0])).toBe(true);
    expect(state.last?.sunk).toBe(4);
    expect(shipsLeft(state, 1)).toBe(4);
  });

  it("wins by sinking the whole fleet", () => {
    let state = setup({ rng: createRng(5) });
    for (let ship = 0; ship < FLEET.length; ship++) state = sinkShip(state, ship);
    expect(state.turn).toBeNull();
    expect(result(state)).toEqual({ winners: [0], scores: [5, 0] });
  });

  it.each([
    ["a cell off the board", 100],
    ["half a cell", 2.5],
  ])("turns down %s", (_, cell) => {
    expect(() => play(setup(), 0, cell)).toThrow(IllegalMoveError);
  });

  it("turns down a cell already fired at, or a shot out of turn", () => {
    const fired = play(setup(), 0, 0).state;
    expect(() => play(fired, 0, 1)).toThrow(IllegalMoveError);
    const back = play(fired, 1, 50).state;
    expect(() => play(back, 0, 0)).toThrow(IllegalMoveError);
  });
});

describe("view", () => {
  it("shows your own ships, and only the other ships you've sunk", () => {
    const state = sinkShip(setup({ rng: createRng(6) }), 4);
    const mine = view(state, 0);
    expect(mine.fleets[0]).toEqual(state.fleets[0]);
    expect(mine.fleets[1]).toEqual([null, null, null, null, state.fleets[1][4]]);
    const watching = view(state, null);
    expect(watching.fleets[0].every((ship) => ship === null)).toBe(true);
  });

  it("shows every ship once the game is over", () => {
    let state = setup({ rng: createRng(7) });
    for (let ship = 0; ship < FLEET.length; ship++) state = sinkShip(state, ship);
    expect(view(state, 1).fleets).toEqual(state.fleets);
  });
});

describe("random games", () => {
  it("always end with one fleet sunk", () => {
    const rng = createRng(8);
    for (let game = 0; game < 100; game++) {
      let state = setup({ firstSeat: game % 2, rng });
      while (state.turn !== null) state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
      const { winners, scores } = result(state)!;
      expect(scores[1 - winners[0]]).toBe(0);
      expect(scores[winners[0]]).toBeGreaterThan(0);
    }
  });
});
