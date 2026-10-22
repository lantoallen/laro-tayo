import { describe, expect, it } from "vitest";
import { createRng, newSeed, rollDie } from "./rng";

describe("rollDie", () => {
  it("rolls every face about equally often", () => {
    const counts = Array(7).fill(0);
    let seed = newSeed(createRng(1));
    for (let i = 0; i < 60000; i++) {
      const rolled = rollDie(seed);
      counts[rolled.roll]++;
      seed = rolled.seed;
    }
    expect(counts[0]).toBe(0);
    for (let face = 1; face <= 6; face++) expect(counts[face]).toBeGreaterThan(9500);
  });

  it("gives the same rolls from the same seed", () => {
    expect(rollDie(42)).toEqual(rollDie(42));
    expect(rollDie(42).seed).not.toBe(42);
  });
});
