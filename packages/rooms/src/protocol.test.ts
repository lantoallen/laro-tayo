import { describe, expect, it } from "vitest";
import { createRng } from "@laro/games";
import { CODE_LENGTH, cleanName, isPlayerId, isRoomCode, makeRoomCode, parseClientMessage } from "./protocol";

describe("room codes", () => {
  it("are 5 characters that are hard to misread", () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i++) {
      const code = makeRoomCode(rng);
      expect(code).toHaveLength(CODE_LENGTH);
      expect(code).not.toMatch(/[IL01O]/);
      expect(isRoomCode(code)).toBe(true);
    }
  });

  it("reject anything else", () => {
    expect(isRoomCode("abcde")).toBe(false);
    expect(isRoomCode("ABCD")).toBe(false);
    expect(isRoomCode("ABCDO")).toBe(false);
    expect(isRoomCode(12345)).toBe(false);
  });
});

describe("isPlayerId", () => {
  it("accepts UUIDs and rejects junk", () => {
    expect(isPlayerId("6f9619ff-8b86-d011-b42d-00c04fc964ff")).toBe(true);
    expect(isPlayerId("short")).toBe(false);
    expect(isPlayerId("has spaces in it")).toBe(false);
    expect(isPlayerId(null)).toBe(false);
  });
});

describe("cleanName", () => {
  it("trims, squeezes spaces, and shortens long names", () => {
    expect(cleanName("  Ana   Marie ")).toBe("Ana Marie");
    expect(cleanName("A".repeat(40))).toHaveLength(20);
    expect(cleanName("Ben\u0000\u0007")).toBe("Ben");
    expect(cleanName(42)).toBe("");
  });
});

describe("parseClientMessage", () => {
  it("reads hello messages and cleans up the name", () => {
    expect(parseClientMessage('{"type":"hello","playerId":"player-ana-1","name":"  Ana  "}')).toEqual({
      type: "hello",
      playerId: "player-ana-1",
      name: "Ana",
    });
    expect(parseClientMessage('{"type":"hello","playerId":"player-ana-1","name":""}')).toEqual({
      type: "hello",
      playerId: "player-ana-1",
      name: "Player",
    });
    expect(parseClientMessage('{"type":"hello","playerId":"x","name":"Ana"}')).toBeNull();
  });

  it("reads moves and rematch requests", () => {
    expect(parseClientMessage('{"type":"move","move":3}')).toEqual({ type: "move", move: 3 });
    expect(parseClientMessage('{"type":"rematch"}')).toEqual({ type: "rematch" });
  });

  it.each(["not json", "null", "[]", '{"type":"move"}', '{"type":"cheat"}', `{"type":"move","move":"${"x".repeat(2000)}"}`])(
    "ignores %s",
    (raw) => {
      expect(parseClientMessage(raw)).toBeNull();
    },
  );
});
