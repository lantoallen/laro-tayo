import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import { CARDS, HIDDEN, PAIRS, countPairs, legalMoves, play, result, setup, view, type MemoryState } from "./rules";

/** Two cards with the same face, and a card with a different face. */
function cardsIn(state: MemoryState) {
  const first = 0;
  const match = state.faces.findIndex((face, card) => card !== first && face === state.faces[first]);
  const other = state.faces.findIndex((face) => face !== state.faces[first]);
  return { first, match, other };
}

describe("setup", () => {
  it("deals 15 pairs face down in a random order", () => {
    const state = setup({ rng: createRng(1) });
    expect(state.faces).toHaveLength(CARDS);
    for (let face = 0; face < PAIRS; face++) expect(state.faces.filter((f) => f === face)).toHaveLength(2);
    expect(state.faces).not.toEqual(setup({ rng: createRng(2) }).faces);
    expect(legalMoves(state, 0)).toHaveLength(CARDS);
  });
});

describe("turning cards over", () => {
  it("keeps a matching pair, then passes the turn", () => {
    const start = setup({ rng: createRng(3) });
    const { first, match } = cardsIn(start);
    const up = play(start, 0, first).state;
    expect(up.flipped).toEqual([first]);
    expect(legalMoves(up, 0)).not.toContain(first);
    const { state, events } = play(up, 0, match);
    expect(state.owner[first]).toBe(0);
    expect(state.owner[match]).toBe(0);
    expect(state.turn).toBe(1);
    expect(state.last).toEqual({ seat: 0, cards: [first, match], matched: true });
    expect(events.at(-1)).toEqual({ type: "match", cards: [first, match] });
  });

  it("passes the turn after a miss, leaving both cards up until the next card is turned", () => {
    const start = setup({ rng: createRng(4) });
    const { first, other } = cardsIn(start);
    const missed = play(play(start, 0, first).state, 0, other).state;
    expect(missed.turn).toBe(1);
    expect(missed.missed).toEqual([first, other]);
    expect(missed.owner.every((o) => o === null)).toBe(true);
    const next = legalMoves(missed, 1).find((card) => card !== first && card !== other)!;
    expect(play(missed, 1, next).state.missed).toEqual([]);
  });

  it.each([
    ["a card off the table", 30],
    ["half a card", 1.5],
  ])("turns down %s", (_, card) => {
    expect(() => play(setup(), 0, card)).toThrow(IllegalMoveError);
  });

  it("turns down a card that's already up or taken", () => {
    const start = setup({ rng: createRng(5) });
    const { first, match } = cardsIn(start);
    const up = play(start, 0, first).state;
    expect(() => play(up, 0, first)).toThrow(IllegalMoveError);
    const taken = play(up, 0, match).state;
    expect(() => play(taken, 1, match)).toThrow(IllegalMoveError);
    expect(() => play(taken, 0, 2)).toThrow(IllegalMoveError);
  });
});

describe("view", () => {
  it("hides the faces of cards that are down", () => {
    const start = setup({ rng: createRng(6) });
    const { first } = cardsIn(start);
    const shown = view(play(start, 0, first).state);
    expect(shown.faces[first]).toBe(start.faces[first]);
    expect(shown.faces.filter((face) => face === HIDDEN)).toHaveLength(CARDS - 1);
  });
});

describe("random games", () => {
  it("always end with every pair taken, with players taking turns", () => {
    const rng = createRng(7);
    for (let game = 0; game < 100; game++) {
      let state = setup({ firstSeat: game % 2, rng });
      while (state.turn !== null) {
        const seat = state.turn;
        state = play(state, seat, pick(rng, legalMoves(state, seat))).state;
        // One card in, it's still the same player. Two cards in, it's always the other one.
        if (state.turn !== null) expect(state.turn === seat).toBe(state.flipped.length === 1);
      }
      const { winners, scores } = result(state)!;
      expect(scores[0] + scores[1]).toBe(PAIRS);
      expect(scores).toEqual([countPairs(state.owner, 0), countPairs(state.owner, 1)]);
      expect(winners).toEqual([scores[0] > scores[1] ? 0 : 1]);
    }
  });
});
