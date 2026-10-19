import { describe, expect, it } from "vitest";
import { legalMoves, play, setup, type DamaState } from "@laro/games/dama";
import { createRoom, joinRoom, playMove, RoomError, snapshotFor } from "./room";

const ana = { id: "player-ana", name: "Ana" };
const ben = { id: "player-ben", name: "Ben" };

function damaRoom() {
  let room = createRoom("ABCDE", "dama", 0);
  room = joinRoom(room, ana, 1, () => 0).room;
  return joinRoom(room, ben, 2, () => 0).room;
}

describe("Dama rooms", () => {
  it("start a Dama game once both seats are taken", () => {
    const room = damaRoom();
    expect(room.seats).toEqual([ana, ben]);
    expect(room.state).toEqual(setup({ firstSeat: 0 }));
  });

  it("apply moves sent as a list of squares", () => {
    const room = damaRoom();
    const [move] = legalMoves(room.state as DamaState, 0);
    const { room: next, lastMove } = playMove(room, ana.id, move, 5);
    const expected = play(room.state as DamaState, 0, move);
    expect(next.state).toEqual(expected.state);
    expect(lastMove.events).toEqual(expected.events);
  });

  it("turn down moves that aren't legal", () => {
    expect(() => playMove(damaRoom(), ana.id, [40, 24], 5)).toThrow(RoomError);
    expect(() => playMove(damaRoom(), ana.id, 40, 5)).toThrow(RoomError);
  });

  it("show both players the whole board", () => {
    const room = damaRoom();
    expect(snapshotFor(room, ben.id, new Set()).view).toEqual(room.state);
  });
});
