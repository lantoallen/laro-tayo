import { describe, expect, it } from "vitest";
import { checkSeats, leaders, nextSeat } from "./seats";

describe("seats", () => {
  it("go around the table", () => {
    expect([0, 1, 2].map((seat) => nextSeat(seat, 3))).toEqual([1, 2, 0]);
  });

  it("share the win between the top scores, and call it a draw when everyone ties", () => {
    expect(leaders([3, 7, 7, 1])).toEqual([1, 2]);
    expect(leaders([5, 2])).toEqual([0]);
    expect(leaders([4, 4, 4])).toEqual([]);
  });

  it("turn down a table the game can't seat", () => {
    expect(() => checkSeats("Pig", 5, 2, 4, 0)).toThrow("Pig is played by 2 to 4 players");
    expect(() => checkSeats("Pig", 3, 2, 4, 3)).toThrow("No seat 3 in Pig");
    expect(() => checkSeats("Pig", 3, 2, 4, 2)).not.toThrow();
  });
});
