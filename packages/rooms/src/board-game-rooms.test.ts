import { describe, expect, it } from "vitest";
import { createRng, pick } from "@laro/games";
import { gameFor } from "./registry";
import { createRoom, joinRoom, playMove, RoomError, snapshotFor, type Room } from "./room";

const ana = { id: "player-ana", name: "Ana" };
const ben = { id: "player-ben", name: "Ben" };

const BOARD_GAMES = [
  "four-in-a-row",
  "reversi",
  "dots-and-boxes",
  "memory",
  "morris",
  "sea-battle",
  "tic-tac-toe",
  "snakes-and-ladders",
  "pig",
  "jak-en-poy",
] as const;

describe.each(BOARD_GAMES)("%s rooms", (id) => {
  const game = gameFor(id);

  function fullRoom(): Room {
    let room = createRoom("ABCDE", id, 0);
    room = joinRoom(room, ana, 1, () => 0).room;
    return joinRoom(room, ben, 2, () => 0).room;
  }

  it("start a game once both seats are taken", () => {
    const room = fullRoom();
    expect(game.turn(room.state)).toBe(0);
    expect(game.legalMoves(room.state, 0).length).toBeGreaterThan(0);
  });

  it("play a whole game through to the end", () => {
    const rng = createRng(4);
    const ids = [ana.id, ben.id];
    let room = fullRoom();
    for (let turn = game.turn(room.state); turn !== null; turn = game.turn(room.state)) {
      room = playMove(room, ids[turn], pick(rng, game.legalMoves(room.state, turn)), 5).room;
    }
    const snapshot = snapshotFor(room, ana.id, new Set());
    expect(snapshot.phase).toBe("over");
    expect(snapshot.result).toEqual(game.result(room.state));
  });

  it("turn down moves that aren't legal", () => {
    for (const move of [-1, 999, 1.5, "3", null, [3]]) {
      expect(() => playMove(fullRoom(), ana.id, move, 5)).toThrow(RoomError);
    }
  });

  it("send each player only what they may see", () => {
    const room = fullRoom();
    expect(snapshotFor(room, ana.id, new Set()).view).toEqual(game.view(room.state, 0));
    expect(snapshotFor(room, ben.id, new Set()).view).toEqual(game.view(room.state, 1));
  });
});

describe("hidden cards and ships in rooms", () => {
  function fullRoom(id: "memory" | "sea-battle"): Room {
    let room = createRoom("ABCDE", id, 0);
    room = joinRoom(room, ana, 1, () => 0).room;
    return joinRoom(room, ben, 2, () => 0).room;
  }

  it("never send a Memory card's face before it's turned up", () => {
    const view = snapshotFor(fullRoom("memory"), ben.id, new Set()).view as { faces: number[] };
    expect(view.faces.every((face) => face === -1)).toBe(true);
  });

  it("never send the other player's ships in Sea Battle", () => {
    const room = fullRoom("sea-battle");
    const view = snapshotFor(room, ben.id, new Set()).view as { fleets: (number[] | null)[][] };
    expect(view.fleets[0].every((ship) => ship === null)).toBe(true);
    expect(view.fleets[1]).toEqual((room.state as { fleets: unknown[][] }).fleets[1]);
  });
});

describe("dice and hidden picks in rooms", () => {
  function fullRoom(id: "pig" | "jak-en-poy"): Room {
    let room = createRoom("ABCDE", id, 0);
    room = joinRoom(room, ana, 1, () => 0).room;
    return joinRoom(room, ben, 2, () => 0).room;
  }

  it("never send the seed for Pig's next roll", () => {
    const view = snapshotFor(fullRoom("pig"), ana.id, new Set()).view as { seed: number };
    expect(view.seed).toBe(0);
  });

  it("never send a Jak-en-poy pick before both players have picked", () => {
    const room = playMove(fullRoom("jak-en-poy"), ana.id, "paper", 5).room;
    const forBen = snapshotFor(room, ben.id, new Set()).view as { picks: unknown[] };
    expect(forBen.picks).toEqual(["hidden", null]);
  });
});
