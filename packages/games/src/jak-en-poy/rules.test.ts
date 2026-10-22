import { describe, expect, it } from "vitest";
import { createRng, pick } from "../engine/rng";
import { IllegalMoveError } from "../engine/types";
import {
  CHOICES,
  TARGET,
  legalMoves,
  play,
  result,
  roundWinner,
  setup,
  view,
  type JakMove,
  type JakState,
} from "./rules";

/** Plays one round, each seat picking in turn. */
function round(state: JakState, picks: [JakMove, JakMove]): JakState {
  const first = state.turn!;
  state = play(state, first, picks[first]).state;
  return play(state, state.turn!, picks[state.turn!]).state;
}

describe("Jak-en-poy", () => {
  it("decides a round by rock, paper, scissors", () => {
    expect(roundWinner(["rock", "scissors"])).toBe(0);
    expect(roundWinner(["rock", "paper"])).toBe(1);
    expect(roundWinner(["scissors", "paper"])).toBe(0);
    expect(roundWinner(["paper", "paper"])).toBeNull();
  });

  it("waits for both picks, then scores the round", () => {
    const one = play(setup(), 0, "rock").state;
    expect(one.turn).toBe(1);
    expect(one.scores).toEqual([0, 0]);
    const { state, events } = play(one, 1, "scissors");
    expect(state.scores).toEqual([1, 0]);
    expect(state.picks).toEqual([null, null]);
    expect(state.rounds).toEqual([{ picks: ["rock", "scissors"], winner: 0 }]);
    expect(events.at(-1)).toEqual({ type: "round", picks: ["rock", "scissors"], winner: 0 });
  });

  it("doesn't count a tie", () => {
    const state = round(setup(), ["paper", "paper"]);
    expect(state.scores).toEqual([0, 0]);
    expect(state.rounds[0].winner).toBeNull();
  });

  it("hides the other player's pick until the round is decided", () => {
    const one = play(setup({ firstSeat: 1 }), 1, "rock").state;
    expect(view(one, 0).picks).toEqual([null, "hidden"]);
    expect(view(one, 1).picks).toEqual([null, "rock"]);
    expect(view(one, null).picks).toEqual([null, "hidden"]);
  });

  it("ends when someone wins three rounds", () => {
    let state = setup();
    for (let i = 0; i < TARGET; i++) state = round(state, ["paper", "rock"]);
    expect(state.turn).toBeNull();
    expect(result(state)).toEqual({ winners: [0], scores: [3, 0] });
  });

  it("turns down a pick that isn't rock, paper, or scissors, or one out of turn", () => {
    expect(() => play(setup(), 0, "lizard" as JakMove)).toThrow(IllegalMoveError);
    expect(() => play(setup(), 1, "rock")).toThrow(IllegalMoveError);
  });

  it("always ends", () => {
    const rng = createRng(5);
    for (let game = 0; game < 200; game++) {
      let state = setup({ firstSeat: game % 2 });
      while (state.turn !== null) state = play(state, state.turn, pick(rng, legalMoves(state, state.turn))).state;
      expect(Math.max(...state.scores)).toBe(TARGET);
      expect(CHOICES).toContain(state.rounds[0].picks[0]);
    }
  });
});
