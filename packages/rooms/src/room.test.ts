import { describe, expect, it } from "vitest";
import { createRng, pick } from "@laro/games";
import { legalMoves, play, setup, type SungkaState } from "@laro/games/sungka";
import { createRoom, joinRoom, playMove, requestRematch, RoomError, snapshotFor, type Room } from "./room";

const ana = { id: "player-ana", name: "Ana" };
const ben = { id: "player-ben", name: "Ben" };
const cai = { id: "player-cai", name: "Cai" };

/** Always picks seat 0 to go first. */
const firstSeatZero = () => 0;

function fullRoom(): Room {
  let room = createRoom("ABCDE", "sungka", 0);
  room = joinRoom(room, ana, 1, firstSeatZero).room;
  return joinRoom(room, ben, 2, firstSeatZero).room;
}

/** Plays random legal moves until the game is over. */
function playToEnd(room: Room): Room {
  const rng = createRng(8);
  const ids = room.seats.map((player) => player!.id);
  for (let guard = 0; guard < 500; guard++) {
    const state = room.state as SungkaState;
    if (state.turn === null) return room;
    room = playMove(room, ids[state.turn], pick(rng, legalMoves(state, state.turn)), 10).room;
  }
  throw new Error("The game never ended");
}

describe("joinRoom", () => {
  it("seats players in order and starts the game when the room is full", () => {
    let room = createRoom("ABCDE", "sungka", 0);
    const first = joinRoom(room, ana, 1, firstSeatZero);
    expect(first.seat).toBe(0);
    expect(first.room.state).toBeNull();

    room = joinRoom(first.room, ben, 2, firstSeatZero).room;
    expect(room.seats).toEqual([ana, ben]);
    expect(room.round).toBe(1);
    expect(room.state).toEqual(setup({ firstSeat: 0 }));
  });

  it("lets the random number pick who goes first", () => {
    let room = joinRoom(createRoom("ABCDE", "sungka", 0), ana, 1, () => 0.9).room;
    room = joinRoom(room, ben, 2, () => 0.9).room;
    expect(room.firstSeat).toBe(1);
    expect((room.state as SungkaState).turn).toBe(1);
  });

  it("gives a returning player the same seat and their new name", () => {
    const room = fullRoom();
    const back = joinRoom(room, { id: ana.id, name: "Ana B." }, 3, firstSeatZero);
    expect(back.seat).toBe(0);
    expect(back.room.seats[0]).toEqual({ id: ana.id, name: "Ana B." });
    expect(back.room.state).toEqual(room.state);
  });

  it("lets later arrivals watch without taking a seat", () => {
    const room = fullRoom();
    const watcher = joinRoom(room, cai, 3, firstSeatZero);
    expect(watcher.seat).toBeNull();
    expect(watcher.room).toBe(room);
  });
});

describe("playMove", () => {
  it("applies a move from the player whose turn it is", () => {
    const room = fullRoom();
    const { room: next, lastMove } = playMove(room, ana.id, 3, 5);
    const expected = play(room.state as SungkaState, 0, 3);
    expect(next.state).toEqual(expected.state);
    expect(lastMove).toEqual({ seat: 0, events: expected.events, moveNumber: 1 });
    expect(next.moveCount).toBe(1);
  });

  it.each([
    ["before the game starts", () => joinRoom(createRoom("ABCDE", "sungka", 0), ana, 1, firstSeatZero).room, ana.id, 3],
    ["out of turn", fullRoom, ben.id, 10],
    ["from someone watching", fullRoom, cai.id, 3],
    ["from an empty house", () => playMove(fullRoom(), ana.id, 3, 5).room, ben.id, 15],
  ])("rejects a move %s", (_, makeRoom, playerId, move) => {
    expect(() => playMove(makeRoom(), playerId, move, 5)).toThrow(RoomError);
  });

  it("explains why a move was turned down", () => {
    expect(() => playMove(fullRoom(), ben.id, 10, 5)).toThrow("It's not your turn.");
    expect(() => playMove(fullRoom(), ana.id, 9, 5)).toThrow("You can't play that move.");
    expect(() => playMove(playToEnd(fullRoom()), ana.id, 3, 5)).toThrow("This game is over.");
  });

  it("rejects moves that aren't house numbers", () => {
    expect(() => playMove(fullRoom(), ana.id, "3", 5)).toThrow(RoomError);
    expect(() => playMove(fullRoom(), ana.id, { house: 3 }, 5)).toThrow(RoomError);
  });
});

describe("requestRematch", () => {
  it("can't be asked for while the game is still going", () => {
    expect(() => requestRematch(fullRoom(), ana.id, 5)).toThrow(RoomError);
  });

  it("starts the next game once both players ask, with the other player going first", () => {
    const over = playToEnd(fullRoom());
    const asked = requestRematch(over, ana.id, 20);
    expect(asked.round).toBe(1);
    expect(asked.rematch).toEqual([ana.id]);

    const next = requestRematch(asked, ben.id, 21);
    expect(next.round).toBe(2);
    expect(next.firstSeat).toBe(1);
    expect(next.moveCount).toBe(0);
    expect(next.rematch).toEqual([]);
    expect(next.state).toEqual(setup({ firstSeat: 1 }));
  });

  it("doesn't count the same player twice", () => {
    const over = playToEnd(fullRoom());
    const twice = requestRematch(requestRematch(over, ana.id, 20), ana.id, 21);
    expect(twice.round).toBe(1);
    expect(twice.rematch).toEqual([ana.id]);
  });

  it("is only for players", () => {
    expect(() => requestRematch(playToEnd(fullRoom()), cai.id, 20)).toThrow(RoomError);
  });
});

describe("snapshotFor", () => {
  it("tells each player their seat and who is connected", () => {
    const room = fullRoom();
    const snapshot = snapshotFor(room, ben.id, new Set([ben.id]));
    expect(snapshot.you).toBe(1);
    expect(snapshot.seats).toEqual([
      { name: "Ana", connected: false, away: false },
      { name: "Ben", connected: true, away: false },
    ]);
    expect(snapshot.phase).toBe("playing");
    expect(snapshot.view).toEqual(room.state);
  });

  it("shows a waiting room before the second player arrives", () => {
    const room = joinRoom(createRoom("ABCDE", "sungka", 0), ana, 1, firstSeatZero).room;
    const snapshot = snapshotFor(room, ana.id, new Set([ana.id]));
    expect(snapshot.phase).toBe("waiting");
    expect(snapshot.seats[1]).toBeNull();
    expect(snapshot.view).toBeNull();
  });

  it("includes the result and rematch votes once the game ends", () => {
    const over = requestRematch(playToEnd(fullRoom()), ben.id, 20);
    const snapshot = snapshotFor(over, cai.id, new Set());
    expect(snapshot.you).toBeNull();
    expect(snapshot.phase).toBe("over");
    expect(snapshot.result).not.toBeNull();
    expect(snapshot.rematch).toEqual([1]);
  });
});
