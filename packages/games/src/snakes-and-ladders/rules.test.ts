import { describe, expect, it } from "vitest";
import { createRng, rollDie } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import {
  LADDERS,
  LAST_SQUARE,
  SNAKES,
  legalMoves,
  nextMove,
  play,
  result,
  setup,
  type SnakesEvent,
  type SnakesMove,
  type SnakesState,
} from "./rules";

/** A seed whose next roll is `roll`. */
function seedFor(roll: number): number {
  for (let seed = 0; ; seed++) if (rollDie(seed).roll === roll) return seed;
}

function at(position: number, roll: number): SnakesState {
  return { ...setup(), positions: [position, 0], seed: seedFor(roll) };
}

/** Plays every move of the current player's turn. */
function takeTurn(state: SnakesState) {
  const seat = state.turn!;
  const moves: SnakesMove[] = [];
  const events: SnakesEvent[] = [];
  do {
    const move = nextMove(state)!;
    const outcome = play(state, seat, move);
    moves.push(move);
    events.push(...outcome.events);
    state = outcome.state;
  } while (state.turn === seat);
  return { state, moves, events };
}

describe("Snakes and Ladders", () => {
  it("starts both players off the board", () => {
    const state = setup({ firstSeat: 1, rng: createRng(1) });
    expect(state.positions).toEqual([0, 0]);
    expect(state.turn).toBe(1);
    expect(legalMoves(state, 1)).toEqual(["roll"]);
  });

  it("moves one square per step after the roll, then passes the turn", () => {
    let state = play(at(10, 3), 0, "roll").state;
    expect(state.moving).toEqual({ roll: 3, left: 3 });
    expect(state.positions[0]).toBe(10);
    expect(legalMoves(state, 0)).toEqual(["step"]);
    expect(legalMoves(state, 1)).toEqual([]);

    const step = play(state, 0, "step");
    expect(step.events).toEqual([{ type: "move", from: 10, to: 11 }]);
    state = play(play(step.state, 0, "step").state, 0, "step").state;
    expect(state.positions[0]).toBe(13);
    expect(state.moving).toBeNull();
    expect(state.turn).toBe(1);
    expect(state.last).toEqual({ seat: 0, roll: 3, from: 10, landed: 13, to: 13, jump: null });
  });

  it("stops at a ladder or snake until the player follows it", () => {
    const up = takeTurn(at(26, 2));
    expect(up.moves).toEqual(["roll", "step", "step", "jump"]);
    expect(up.events.at(-1)).toEqual({ type: "jump", from: 28, to: LADDERS[28], jump: "ladder" });
    expect(up.state.last).toEqual({ seat: 0, roll: 2, from: 26, landed: 28, to: LADDERS[28], jump: "ladder" });

    let down = play(at(85, 2), 0, "roll").state;
    down = play(play(down, 0, "step").state, 0, "step").state;
    expect(down.positions[0]).toBe(87);
    expect(down.turn).toBe(0);
    expect(legalMoves(down, 0)).toEqual(["jump"]);
    down = play(down, 0, "jump").state;
    expect(down.positions[0]).toBe(SNAKES[87]);
    expect(down.last?.jump).toBe("snake");
    expect(down.turn).toBe(1);
  });

  it("doesn't move on a roll that would pass the last square", () => {
    const { state, moves } = takeTurn(at(97, 5));
    expect(moves).toEqual(["roll"]);
    expect(state.positions[0]).toBe(97);
    expect(state.last).toMatchObject({ roll: 5, landed: 97, to: 97 });
    expect(state.turn).toBe(1);
  });

  it("wins on landing exactly on the last square", () => {
    const { state } = takeTurn(at(96, 4));
    expect(state.positions[0]).toBe(LAST_SQUARE);
    expect(state.turn).toBeNull();
    expect(nextMove(state)).toBeNull();
    expect(result(state)).toEqual({ winners: [0], scores: [100, 0] });
  });

  it("turns down moves out of order, and moves out of turn", () => {
    expect(() => play(setup(), 0, "step")).toThrow(IllegalMoveError);
    expect(() => play(setup(), 0, "move" as SnakesMove)).toThrow(IllegalMoveError);
    expect(() => play(setup(), 1, "roll")).toThrow(IllegalMoveError);
    const rolled = play(at(10, 3), 0, "roll").state;
    expect(() => play(rolled, 0, "roll")).toThrow(IllegalMoveError);
    expect(() => play(rolled, 0, "jump")).toThrow(IllegalMoveError);
  });

  it("never puts anyone on a snake's head or a ladder's foot", () => {
    for (const square of [...Object.keys(LADDERS), ...Object.keys(SNAKES)].map(Number)) {
      expect(Object.values(LADDERS)).not.toContain(square);
      expect(Object.values(SNAKES)).not.toContain(square);
    }
  });

  it("always ends", () => {
    const rng = createRng(2);
    for (let game = 0; game < 300; game++) {
      let state = setup({ firstSeat: game % 2, rng });
      while (state.turn !== null) {
        state = takeTurn(state).state;
        expect(state.turns).toBeLessThan(2000);
      }
      expect(state.positions).toContain(LAST_SQUARE);
    }
  });
});

describe("Snakes and Ladders with more players", () => {
  it("takes turns around a table of up to four", () => {
    let state = setup({ seats: 4, firstSeat: 2, rng: createRng(3) });
    expect(state.positions).toEqual([0, 0, 0, 0]);
    const order: number[] = [];
    for (let i = 0; i < 8; i++) {
      order.push(state.turn!);
      state = takeTurn(state).state;
    }
    expect(order).toEqual([2, 3, 0, 1, 2, 3, 0, 1]);
  });

  it.each([1, 5])("turns down %s players", (seats) => {
    expect(() => setup({ seats })).toThrow();
  });

  it("always ends with three players", () => {
    const rng = createRng(4);
    for (let game = 0; game < 100; game++) {
      let state = setup({ seats: 3, firstSeat: game % 3, rng });
      while (state.turn !== null) state = takeTurn(state).state;
      expect(result(state)!.scores).toHaveLength(3);
    }
  });
});
