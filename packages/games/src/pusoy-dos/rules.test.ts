import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError, type Seat } from "../engine/types";
import { THREE_OF_CLUBS, describe as read } from "./cards";
import { legalMoves, play, result, setup, viewFor, type PusoyState } from "./rules";

/** A state with the given hands, where seat 0 is about to start a fresh round. */
function stateWith(hands: number[][], extra: Partial<PusoyState> = {}): PusoyState {
  return { hands, turn: 0, table: null, passes: 0, opening: false, winner: null, turns: 0, ...extra };
}

describe("setup", () => {
  it("deals 13 different cards to each of 4 players", () => {
    const state = setup({ rng: createRng(1) });
    expect(state.hands).toHaveLength(4);
    expect(state.hands.every((hand) => hand.length === 13)).toBe(true);
    expect(new Set(state.hands.flat()).size).toBe(52);
  });

  it("lets whoever has the 3 of clubs go first, and only with a play that includes it", () => {
    const state = setup({ rng: createRng(2) });
    expect(state.hands[state.turn!]).toContain(THREE_OF_CLUBS);
    const moves = legalMoves(state, state.turn!);
    expect(moves.length).toBeGreaterThan(0);
    expect(moves.every((cards) => cards.includes(THREE_OF_CLUBS))).toBe(true);
  });

  it("only allows four players", () => {
    expect(() => setup({ seats: 3 })).toThrow();
  });
});

describe("play", () => {
  const hands = [
    [4, 5, 20, 40],
    [8, 9, 24, 44],
    [12, 13, 28, 48],
    [16, 17, 32, 51],
  ];

  it("makes later players beat the last play with the same number of cards", () => {
    const { state } = play(stateWith(hands), 0, [4, 5]);
    const moves = legalMoves(state, 1);
    expect(moves).toContainEqual([8, 9]);
    expect(moves).toContainEqual([]);
    expect(moves.some((cards) => cards.length === 1)).toBe(false);
  });

  it("hands the next round to the last player when everyone else passes", () => {
    let { state } = play(stateWith(hands), 0, [40]);
    state = play(state, 1, []).state;
    state = play(state, 2, []).state;
    const last = play(state, 3, []);
    expect(last.state.turn).toBe(0);
    expect(last.state.table).toBeNull();
    expect(last.events.at(-1)).toEqual({ type: "roundWon", seat: 0 });
  });

  it("lets a player who passed play again later in the same round", () => {
    let { state } = play(stateWith(hands), 0, [4]);
    state = play(state, 1, []).state;
    state = play(state, 2, [12]).state;
    state = play(state, 3, [16]).state;
    expect(legalMoves(state, 0).length).toBeGreaterThan(1);
    expect(legalMoves(play(state, 0, []).state, 1)).toContainEqual([24]);
  });

  it("ends the game when someone plays their last card", () => {
    const { state, events } = play(stateWith([[51], [0, 1], [2, 3], [4, 5]]), 0, [51]);
    expect(state.turn).toBeNull();
    expect(events.at(-1)).toEqual({ type: "gameOver", winner: 0 });
    expect(result(state)).toEqual({ winners: [0], scores: [0, 2, 2, 2] });
  });

  it.each<[string, PusoyState, Seat, number[]]>([
    ["it isn't your turn", stateWith(hands), 1, [8]],
    ["you don't have the cards", stateWith(hands), 0, [8]],
    ["the cards don't make a hand", stateWith(hands), 0, [4, 20]],
    ["the first play skips the 3 of clubs", stateWith([[0, 4], [8], [12], [16]], { opening: true }), 0, [4]],
    ["you pass while starting a round", stateWith(hands), 0, []],
  ])("rejects a move when %s", (_, state, seat, move) => {
    expect(() => play(state, seat, move)).toThrow(IllegalMoveError);
  });

  it("rejects a play that doesn't beat the table", () => {
    const { state } = play(stateWith(hands), 0, [40]);
    expect(() => play(state, 1, [9])).toThrow(IllegalMoveError);
  });
});

describe("viewFor", () => {
  it("shows a player only their own hand and everyone's card counts", () => {
    const state = setup({ rng: createRng(3) });
    const view = viewFor(state, 2);
    expect(view.hand).toEqual(state.hands[2]);
    expect(view.counts).toEqual([13, 13, 13, 13]);
    expect(JSON.stringify(view)).not.toContain(JSON.stringify(state.hands[0]));
    expect("hands" in view).toBe(false);
  });

  it("shows someone watching no hands at all", () => {
    expect(viewFor(setup({ rng: createRng(3) }), null).hand).toBeNull();
  });
});

describe("random games", () => {
  it("keep all 52 cards, only allow legal plays, and always end", () => {
    const rng = createRng(77);
    for (let game = 0; game < 100; game++) {
      let state = setup({ rng });
      const played: number[] = [];
      while (state.turn !== null) {
        expect(state.turns).toBeLessThan(1000);
        const move = pick(rng, legalMoves(state, state.turn));
        if (move.length > 0) {
          expect(read(move)).not.toBeNull();
          played.push(...move);
        }
        state = play(state, state.turn, move).state;
        expect(state.hands.flat().length + played.length).toBe(52);
      }
      expect(result(state)!.scores[state.winner!]).toBe(0);
    }
  });
});
