import { describe, expect, it } from "vitest";
import { createRng } from "@laro/games";
import { ROUND_MS, legalMoves, type TilesState } from "@laro/games/sinking-tiles";
import { createRoom, joinRoom, pauseClock, playMove, RoomError, snapshotFor, timeOutRound, type Room } from "./room";

const ana = { id: "player-ana", name: "Ana" };
const ben = { id: "player-ben", name: "Ben" };
const cai = { id: "player-cai", name: "Cai" };

/** A room for Sinking Tiles with everyone moving at once, full and started at time 0. */
function fullRoom(): Room {
  let room = createRoom("ABCDE", "sinking-tiles-together", 0, 3);
  for (const player of [ana, ben, cai]) room = joinRoom(room, player, 0, () => 0).room;
  return room;
}

const stateOf = (room: Room) => room.state as TilesState;
const seatIds = (room: Room) => room.seats.map((player) => player!.id);

describe("rooms where everyone moves at once", () => {
  it("start the clock when the game starts", () => {
    const room = fullRoom();
    expect(room.deadline).toBe(ROUND_MS);
    expect(snapshotFor(room, ana.id, new Set(), 4000).timeLeftMs).toBe(ROUND_MS - 4000);
  });

  it("take picks in any order, but only one from each player a round", () => {
    let room = fullRoom();
    const ids = seatIds(room);
    room = playMove(room, ids[2], legalMoves(stateOf(room), 2)[0], 1000).room;
    expect(() => playMove(room, ids[2], legalMoves(stateOf(fullRoom()), 2)[1], 1100)).toThrow(
      new RoomError("You've already moved this round."),
    );
    // Picks are hidden from the other players until the round is played.
    expect((snapshotFor(room, ids[0], new Set()).view as TilesState).picks[2]).toBe("hidden");
    // The clock keeps running through the round.
    expect(room.deadline).toBe(ROUND_MS);
  });

  it("start the clock again once a round is played", () => {
    let room = fullRoom();
    const ids = seatIds(room);
    for (const seat of [1, 0, 2]) room = playMove(room, ids[seat], legalMoves(stateOf(room), seat)[0], 3000).room;
    expect(stateOf(room).round).toBe(1);
    expect(room.deadline).toBe(3000 + ROUND_MS);
  });

  it("play the round for anyone who hasn't picked once time runs out", () => {
    let room = fullRoom();
    room = playMove(room, seatIds(room)[0], legalMoves(stateOf(room), 0)[0], 1000).room;
    expect(timeOutRound(room, ROUND_MS - 1, createRng(1))).toBeNull();
    const timedOut = timeOutRound(room, ROUND_MS, createRng(1))!;
    expect(stateOf(timedOut).round).toBe(1);
    expect(timedOut.moveCount).toBe(room.moveCount + 1);
    expect(timedOut.deadline).toBe(2 * ROUND_MS);
  });

  it("stop the clock while everyone is away, and start it again when someone comes back", () => {
    const paused = pauseClock(fullRoom());
    expect(paused.deadline).toBeNull();
    expect(timeOutRound(paused, 99_999, createRng(1))).toBeNull();
    expect(joinRoom(paused, ana, 50_000, () => 0).room.deadline).toBe(50_000 + ROUND_MS);
  });

  it("have no clock in games that take turns", () => {
    let room = createRoom("ABCDE", "sinking-tiles", 0);
    for (const player of [ana, ben]) room = joinRoom(room, player, 0, () => 0).room;
    expect(room.deadline).toBeNull();
    expect(snapshotFor(room, ana.id, new Set()).timeLeftMs).toBeNull();
    expect(timeOutRound(room, 99_999, createRng(1))).toBeNull();
  });
});
