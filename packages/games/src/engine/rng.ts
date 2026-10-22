/** Returns a number in [0, 1). */
export type Rng = () => number;

/** A small seeded random number generator (mulberry32), so games and bots can be replayed in tests. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error("Can't pick from an empty list");
  return items[Math.floor(rng() * items.length)];
}

/** A seed to keep in a game's state, for dice rolled during play. */
export function newSeed(rng: Rng = Math.random): number {
  return Math.floor(rng() * 4294967296) >>> 0;
}

/**
 * Rolls a die from the seed a game keeps in its state, and returns the next
 * seed to store. Keeping the seed in the state means the room server decides
 * every roll, and a game can be replayed exactly in tests.
 */
export function rollDie(seed: number, sides = 6): { roll: number; seed: number } {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { roll: Math.floor(value * sides) + 1, seed: next };
}
