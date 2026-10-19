import { describe as group, expect, it } from "vitest";
import { beats, cardLabel, cardOf, combosIn, describe, type Card } from "./cards";

const RANK = { "3": 0, "4": 1, "5": 2, "6": 3, "7": 4, "8": 5, "9": 6, "10": 7, J: 8, Q: 9, K: 10, A: 11, "2": 12 } as const;
const SUIT = { c: 0, s: 1, h: 2, d: 3 } as const;

/** Cards written like "10h" or "2d". */
const cards = (text: string): Card[] =>
  text.split(" ").map((label) => {
    const suit = label.at(-1) as keyof typeof SUIT;
    return cardOf(RANK[label.slice(0, -1) as keyof typeof RANK], SUIT[suit]);
  });

const combo = (text: string) => describe(cards(text));
const beat = (a: string, b: string) => beats(combo(a)!, combo(b)!);

group("cards", () => {
  it("run from the 3 of clubs up to the 2 of diamonds", () => {
    expect(cardLabel(0)).toBe("3♣");
    expect(cardLabel(51)).toBe("2♦");
    expect(cards("Ah")[0]).toBeLessThan(cards("2c")[0]);
  });
});

group("describe", () => {
  it.each([
    ["Kd", "single"],
    ["7c 7h", "pair"],
    ["9s 9h 9d", "triple"],
    ["3c 4d 5h 6s 7c", "straight"],
    ["10s J s Q s".replace(/ s/g, "s"), null],
    ["3h 8h Jh Kh 2h", "flush"],
    ["5c 5d 5h Js Jd", "fullHouse"],
    ["Qc Qs Qh Qd 4c", "fourOfAKind"],
    ["6d 7d 8d 9d 10d", "straightFlush"],
  ])("reads %s", (text, kind) => {
    expect(combo(text)?.kind ?? null).toBe(kind);
  });

  it.each(["7c 8h", "9s 9h 10d", "3c 4d 5h 6s", "Jc Qd Kh As 2c", "4c 4d 4h 4s"])("rejects %s", (text) => {
    expect(combo(text)).toBeNull();
  });

  it("doesn't let a 2 into a straight", () => {
    expect(combo("Jc Qd Kh As 2c")).toBeNull();
    expect(combo("10c Jd Qh Ks Ac")?.kind).toBe("straight");
  });
});

group("beats", () => {
  it("compares singles by rank, then suit", () => {
    expect(beat("2c", "Ad")).toBe(true);
    expect(beat("7d", "7h")).toBe(true);
    expect(beat("7h", "7d")).toBe(false);
  });

  it("compares pairs by their best card", () => {
    expect(beat("8c 8d", "8s 8h")).toBe(true);
    expect(beat("8s 8h", "9c 9s")).toBe(false);
  });

  it("only compares plays with the same number of cards", () => {
    expect(beat("2d", "3c 3s")).toBe(false);
    expect(beat("3c 3s", "2d")).toBe(false);
  });

  it("ranks five-card hands straight, flush, full house, four of a kind, straight flush", () => {
    const order = ["9c 10d Jh Qs Kc", "3h 8h Jh Kh 2h", "5c 5d 5h Js Jd", "4c 4s 4h 4d 6c", "6d 7d 8d 9d 10d"];
    for (let i = 1; i < order.length; i++) {
      expect(beat(order[i], order[i - 1])).toBe(true);
      expect(beat(order[i - 1], order[i])).toBe(false);
    }
  });

  it("compares flushes by suit first", () => {
    expect(beat("3d 4d 6d 8d 9d", "5h 9h Jh Ah 2h")).toBe(true);
  });

  it("compares full houses by their three of a kind", () => {
    expect(beat("6c 6d 6h 3s 3d", "5c 5d 5h Ks Kd")).toBe(true);
  });
});

group("combosIn", () => {
  it("finds every single, pair, triple, and five-card hand", () => {
    const found = combosIn(cards("3c 3d 3h 4s 5d 6h 7c"));
    const kinds = found.map((c) => describe(c)!.kind);
    expect(kinds.filter((k) => k === "single")).toHaveLength(7);
    expect(kinds.filter((k) => k === "pair")).toHaveLength(3);
    expect(kinds.filter((k) => k === "triple")).toHaveLength(1);
    expect(kinds.filter((k) => k === "straight")).toHaveLength(3);
  });
});
