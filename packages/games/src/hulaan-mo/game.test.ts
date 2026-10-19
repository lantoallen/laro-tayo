import { describe, expect, it } from "vitest";
import { createRng } from "../engine/rng";
import { HulaanError, createGame, leaders, reduce, type HulaanAction, type HulaanSettings, type HulaanState } from "./game";
import { PACKS, packWords } from "./words";

const settings: HulaanSettings = { teams: 2, seconds: 60, rounds: 1, pack: "food" };

const run = (state: HulaanState, ...actions: HulaanAction["type"][]) =>
  actions.reduce((s, type) => reduce(s, { type } as HulaanAction), state);

describe("word packs", () => {
  it("each have 40 different words", () => {
    for (const pack of PACKS) {
      expect(pack.words).toHaveLength(40);
      expect(new Set(pack.words).size).toBe(40);
    }
  });

  it("mix every pack together", () => {
    expect(packWords("mixed")).toHaveLength(120);
  });
});

describe("createGame", () => {
  it("shuffles the chosen pack and starts with the first team getting ready", () => {
    const state = createGame(settings, createRng(1));
    expect([...state.deck].sort()).toEqual([...packWords("food")].sort());
    expect(state.phase).toBe("ready");
    expect(state.scores).toEqual([0, 0]);
  });

  it("deals the same order for the same seed", () => {
    expect(createGame(settings, createRng(5)).deck).toEqual(createGame(settings, createRng(5)).deck);
  });

  it.each([1, 5, 2.5])("turns down %s teams", (teams) => {
    expect(() => createGame({ ...settings, teams })).toThrow(HulaanError);
  });
});

describe("a turn", () => {
  it("shows a word once it starts", () => {
    const state = run(createGame(settings, createRng(2)), "start");
    expect(state.phase).toBe("playing");
    expect(state.word).toBe(state.deck[0]);
  });

  it("scores a point for a word guessed and moves to the next word either way", () => {
    const start = createGame(settings, createRng(3));
    const state = run(start, "start", "got", "skip", "got");
    expect(state.scores).toEqual([2, 0]);
    expect(state.turnWords).toEqual([
      { word: start.deck[0], got: true },
      { word: start.deck[1], got: false },
      { word: start.deck[2], got: true },
    ]);
    expect(state.word).toBe(start.deck[3]);
  });

  it("counts the word on screen as missed when time runs out", () => {
    const start = createGame(settings, createRng(4));
    const state = run(start, "start", "got", "timeUp");
    expect(state.phase).toBe("summary");
    expect(state.word).toBeNull();
    expect(state.turnWords.at(-1)).toEqual({ word: start.deck[1], got: false });
  });

  it("starts the next word list fresh for the next team", () => {
    const state = run(createGame(settings, createRng(4)), "start", "got", "timeUp", "next");
    expect(state.team).toBe(1);
    expect(state.phase).toBe("ready");
    expect(state.turnWords).toEqual([]);
  });

  it.each<[HulaanAction["type"][], HulaanAction["type"]]>([
    [[], "got"],
    [[], "timeUp"],
    [["start"], "start"],
    [["start"], "next"],
  ])("turns down an action out of order", (before, action) => {
    const state = run(createGame(settings, createRng(1)), ...before);
    expect(() => reduce(state, { type: action } as HulaanAction)).toThrow(HulaanError);
  });
});

describe("the whole game", () => {
  it("gives every team the set number of turns, then ends", () => {
    let state = createGame({ ...settings, teams: 3, rounds: 2 }, createRng(6));
    const order: number[] = [];
    while (state.phase !== "over") {
      order.push(state.team);
      state = run(state, "start", "got", "timeUp", "next");
    }
    expect(order).toEqual([0, 1, 2, 0, 1, 2]);
    expect(state.scores).toEqual([2, 2, 2]);
    expect(leaders(state)).toEqual([0, 1, 2]);
  });

  it("names the team with the most words", () => {
    const state = run(createGame(settings, createRng(7)), "start", "got", "got", "timeUp", "next", "start", "got", "timeUp", "next");
    expect(state.phase).toBe("over");
    expect(leaders(state)).toEqual([0]);
  });

  it("goes back to the start of the deck instead of running out of words", () => {
    let state = run(createGame(settings, createRng(8)), "start");
    for (let i = 0; i < 45; i++) state = run(state, "skip");
    expect(state.word).toBe(state.deck[45 % 40]);
  });
});
