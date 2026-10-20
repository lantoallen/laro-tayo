import { describe, expect, it } from "vitest";
import { createRng, pick } from "@laro/games";
import { gameFor } from "./registry";
import { createRoom, joinRoom, playMove, RoomError, snapshotFor, type Room } from "./room";

const ana = { id: "player-ana", name: "Ana" };
const ben = { id: "player-ben", name: "Ben" };

describe.each(["four-in-a-row", "reversi", "dots-and-boxes"] as const)("%s rooms", (id) => {
  const game = gameFor(id);

  function fullRoom(): Room {
    let room = createRoom("ABCDE", id, 0);
    room = joinRoom(room, ana, 1, () => 0).room;
    return joinRoom(room, ben, 2, () => 0).room;
  }

  it("start a game once both seats are taken", () => {
    expect(fullRoom().state).toEqual(game.setup({ seats: 2, firstSeat: 0 }));
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

  it("show both players the whole board", () => {
    const room = fullRoom();
    expect(snapshotFor(room, ben.id, new Set()).view).toEqual(room.state);
  });
});
