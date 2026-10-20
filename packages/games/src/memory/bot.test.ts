import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove } from "./bot";
import { legalMoves, play, result, setup, type MemoryState } from "./rules";

/** Positions from the middle of random games. */
function randomPositions(count: number, rng: Rng): MemoryState[] {
  const positions: MemoryState[] = [];
  while (positions.length < count) {
    let state = setup({ firstSeat: positions.length % 2, rng });
    const length = Math.floor(rng() * 40);
    for (let i = 0; i < length && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    if (state.turn !== null) positions.push(state);
  }
  return positions;
}

function playGame(levels: [BotLevel, BotLevel], rng: Rng): Seat | null {
  let state = setup({ rng });
  while (state.turn !== null) {
    state = play(state, state.turn, chooseMove(state, state.turn, { level: levels[state.turn], rng })).state;
  }
  return result(state)!.winners[0] ?? null;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks a legal card on %s", (level) => {
    const rng = createRng(1);
    for (const state of randomPositions(50, rng)) {
      expect(legalMoves(state, state.turn!)).toContain(chooseMove(state, state.turn!, { level, rng }));
    }
  });

  it("never peeks at a card that hasn't been turned up", () => {
    const rng = createRng(2);
    for (const state of randomPositions(50, rng)) {
      // Shuffle the faces of the cards nobody has seen. The bot should play exactly the same.
      const hidden = state.faces.flatMap((_, card) => (state.seen[card] ? [] : [card]));
      const faces = [...state.faces];
      const shuffled = hidden.map((card) => faces[card]).reverse();
      hidden.forEach((card, i) => (faces[card] = shuffled[i]));
      const level: BotLevel = "hard";
      expect(chooseMove({ ...state, faces }, state.turn!, { level, rng: createRng(9) })).toBe(
        chooseMove(state, state.turn!, { level, rng: createRng(9) }),
      );
    }
  });

  it("takes a pair it has seen on hard", () => {
    let state = setup({ rng: createRng(3) });
    const [a, b] = state.faces.flatMap((face, card) => (face === state.faces[0] ? [card] : []));
    state = { ...state, seen: state.seen.map((_, card) => card === a || card === b) };
    expect(chooseMove(state, 0, { level: "hard", rng: createRng(1) })).toBe(a);
    const up = play(state, 0, a).state;
    expect(chooseMove(up, 0, { level: "hard", rng: createRng(1) })).toBe(b);
  });

  it("wins more often the better its memory", () => {
    const rng = createRng(4);
    let hardWins = 0;
    for (let game = 0; game < 40; game++) {
      const hardSeat: Seat = game % 2;
      if (playGame(hardSeat === 0 ? ["hard", "easy"] : ["easy", "hard"], rng) === hardSeat) hardWins++;
    }
    expect(hardWins).toBeGreaterThanOrEqual(30);
  });
});
