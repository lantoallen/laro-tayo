import { describe, expect, it } from "vitest";
import { createRng, pick, type Rng } from "../engine/rng";
import type { BotLevel, Seat } from "../engine/types";
import { chooseMove } from "./bot";
import {
  BOX_LINES,
  LINES,
  LINE_BOXES,
  SIZE,
  horizontalLine,
  isHorizontal,
  legalMoves,
  play,
  result,
  setup,
  sidesDrawn,
  verticalLine,
  type DotsState,
} from "./rules";

/** Positions from the middle of random games. */
function randomPositions(count: number, rng: Rng): DotsState[] {
  const positions: DotsState[] = [];
  while (positions.length < count) {
    let state = setup({ firstSeat: positions.length % 2 });
    const length = Math.floor(rng() * 55);
    for (let i = 0; i < length && state.turn !== null; i++) {
      state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
    }
    if (state.turn !== null) positions.push(state);
  }
  return positions;
}

/** Every horizontal line drawn, which leaves each row of boxes as a chain of 5. */
function rowsOfChains(): DotsState {
  const lines = Array.from({ length: LINES }, (_, line) => (isHorizontal(line) ? 0 : null));
  return { ...setup(), lines };
}

function playGame(levels: [BotLevel, BotLevel], firstSeat: Seat, rng: Rng): Seat | null {
  let state = setup({ firstSeat });
  while (state.turn !== null) {
    state = play(state, state.turn, chooseMove(state, state.turn, { level: levels[state.turn], rng })).state;
  }
  return result(state)!.winners[0] ?? null;
}

describe("chooseMove", () => {
  it.each<BotLevel>(["easy", "medium", "hard"])("always picks a legal move on %s", (level) => {
    const rng = createRng(2);
    for (const state of randomPositions(60, rng)) {
      expect(legalMoves(state, state.turn!)).toContain(chooseMove(state, state.turn!, { level, rng }));
    }
  });

  it.each<BotLevel>(["medium", "hard"])("takes a box when one is there on %s", (level) => {
    const state = play(setup(), 0, horizontalLine(0, 0)).state;
    const offered = {
      ...state,
      lines: state.lines.map((line, i) => ([horizontalLine(1, 0), verticalLine(0, 0)].includes(i) ? 0 : line)),
    };
    expect(chooseMove(offered, 1, { level, rng: createRng(1) })).toBe(verticalLine(0, 1));
  });

  it("doesn't draw a box's third side while it has another choice on medium", () => {
    const rng = createRng(4);
    for (const state of randomPositions(60, rng)) {
      const seat = state.turn!;
      const safe = legalMoves(state, seat).filter((line) =>
        LINE_BOXES[line].every((box) => sidesDrawn(state.lines, box) <= 1),
      );
      const closing = BOX_LINES.some((lines) => lines.filter((line) => state.lines[line] !== null).length === 3);
      if (safe.length === 0 || closing) continue;
      expect(safe).toContain(chooseMove(state, seat, { level: "medium", rng }));
    }
  });

  it("hands back the last two boxes of a chain on hard when that wins more", () => {
    // Seat 0 was handed the top row and has eaten three boxes. Four more chains of 5 are left.
    const lines = rowsOfChains().lines.map((line, i) =>
      [0, 1, 2, 3].some((col) => i === verticalLine(0, col)) ? 0 : line,
    );
    const state: DotsState = { ...setup(), lines, boxes: [0, 0, 0, ...Array(SIZE * SIZE - 3).fill(null)] };
    const rng = createRng(1);
    expect(chooseMove(state, 0, { level: "medium", rng })).toBe(verticalLine(0, 4));
    expect(chooseMove(state, 0, { level: "hard", rng })).toBe(verticalLine(0, 5));
  });

  it("beats medium most games on hard", () => {
    const rng = createRng(12);
    let wins = 0;
    for (let game = 0; game < 20; game++) {
      const hardSeat: Seat = game % 2;
      const levels: [BotLevel, BotLevel] = hardSeat === 0 ? ["hard", "medium"] : ["medium", "hard"];
      if (playGame(levels, game % 4 < 2 ? 0 : 1, rng) === hardSeat) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(14);
  });
});
