import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import {
  BOXES,
  BOX_LINES,
  LINES,
  LINE_BOXES,
  countBoxes,
  horizontalLine,
  legalMoves,
  play,
  result,
  setup,
  verticalLine,
  type DotsState,
} from "./rules";

/** Draws a list of lines, each by whoever's turn it is. */
function draw(lines: number[], state: DotsState = setup()): DotsState {
  for (const line of lines) state = play(state, state.turn!, line).state;
  return state;
}

describe("the board", () => {
  it("has 60 lines around 25 boxes", () => {
    expect(LINES).toBe(60);
    expect(BOXES).toBe(25);
    expect(BOX_LINES.every((lines) => new Set(lines).size === 4)).toBe(true);
    // The 20 lines around the edge border one box each. Every other line borders two.
    expect(LINE_BOXES.filter((boxes) => boxes.length === 1)).toHaveLength(20);
    expect(LINE_BOXES.filter((boxes) => boxes.length === 2)).toHaveLength(40);
  });

  it("starts with every line open and the chosen player first", () => {
    const state = setup({ firstSeat: 1 });
    expect(legalMoves(state, 1)).toHaveLength(60);
    expect(legalMoves(state, 0)).toEqual([]);
    expect(state.boxes.every((owner) => owner === null)).toBe(true);
  });
});

describe("drawing a line", () => {
  it("passes the turn when it doesn't close a box", () => {
    const state = draw([horizontalLine(0, 0)]);
    expect(state.lines[horizontalLine(0, 0)]).toBe(0);
    expect(state.turn).toBe(1);
  });

  it("claims a box with its fourth side and gives another turn", () => {
    const { state, events } = play(
      draw([horizontalLine(0, 0), horizontalLine(1, 0), verticalLine(0, 0)]),
      1,
      verticalLine(0, 1),
    );
    expect(state.boxes[0]).toBe(1);
    expect(state.turn).toBe(1);
    expect(state.last).toEqual({ seat: 1, line: verticalLine(0, 1), boxes: [0] });
    expect(events).toEqual([
      { type: "line", line: verticalLine(0, 1) },
      { type: "box", boxes: [0] },
    ]);
  });

  it("can close two boxes at once", () => {
    const around = [
      horizontalLine(0, 0),
      horizontalLine(1, 0),
      verticalLine(0, 0),
      horizontalLine(0, 1),
      horizontalLine(1, 1),
      verticalLine(0, 2),
    ];
    const before = draw(around);
    const state = play(before, before.turn!, verticalLine(0, 1)).state;
    expect(state.boxes.slice(0, 2)).toEqual([before.turn, before.turn]);
    expect(countBoxes(state.boxes, before.turn!)).toBe(2);
  });

  it.each([
    ["a line that's already drawn", 0],
    ["a line off the board", 60],
    ["half a line", 1.5],
  ])("turns down %s", (_, line) => {
    expect(() => play(draw([0]), 1, line)).toThrow(IllegalMoveError);
  });

  it("turns down a move out of turn", () => {
    expect(() => play(setup(), 1, 0)).toThrow(IllegalMoveError);
  });
});

describe("random games", () => {
  it("end once every box is closed, and only closing a box keeps the turn", () => {
    const rng = createRng(31);
    for (let game = 0; game < 200; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) {
        const seat = state.turn;
        state = play(state, seat, pick(rng, legalMoves(state, seat))).state;
        if (state.turn !== null) expect(state.turn === seat).toBe(state.last!.boxes.length > 0);
      }
      expect(state.lines.every((line) => line !== null)).toBe(true);
      const { winners, scores } = result(state)!;
      expect(scores[0] + scores[1]).toBe(25);
      expect(winners).toEqual([scores[0] > scores[1] ? 0 : 1]);
    }
  });
});

describe("Dots and Boxes with more players", () => {
  it("passes the turn around the table, and closing a box still keeps it", () => {
    let state = setup({ seats: 3 });
    state = draw([horizontalLine(0, 0), horizontalLine(1, 0), verticalLine(0, 0)], state);
    expect(state.turn).toBe(0);
    state = play(state, 0, verticalLine(0, 1)).state;
    expect(state.boxes[0]).toBe(0);
    expect(state.turn).toBe(0);
  });

  it("ends with every box claimed and scores for everyone", () => {
    const rng = createRng(9);
    for (let game = 0; game < 50; game++) {
      let state = setup({ seats: 4, firstSeat: game % 4 });
      while (state.turn !== null) state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
      const { scores } = result(state)!;
      expect(scores).toHaveLength(4);
      expect(scores.reduce((a, b) => a + b, 0)).toBe(25);
    }
  });

  it.each([1, 5])("turns down %s players", (seats) => {
    expect(() => setup({ seats })).toThrow();
  });
});
