import { describe, expect, it } from "vitest";
import { createRng } from "@laro/games";
import { ROUND_MS, legalMoves, type TilesState } from "@laro/games/sinking-tiles";
import { pig } from "@laro/games/pig";
import { ticTacToe } from "@laro/games/tic-tac-toe";
import {
  AWAY_MS,
  comeBack,
  createRoom,
  isAway,
  joinRoom,
  pauseClock,
  playMove,
  RoomError,
  snapshotFor,
  timeOut,
  TURN_MS,
  type Room,
} from "./room";

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
    expect(timeOut(room, ROUND_MS - 1, createRng(1))).toBeNull();
    const timedOut = timeOut(room, ROUND_MS, createRng(1))!.room;
    expect(stateOf(timedOut).round).toBe(1);
    expect(timedOut.moveCount).toBe(room.moveCount + 1);
    expect(timedOut.deadline).toBe(2 * ROUND_MS);
  });

  it("stop the clock while everyone is away, and start it again when someone comes back", () => {
    const paused = pauseClock(fullRoom());
    expect(paused.deadline).toBeNull();
    expect(timeOut(paused, 99_999, createRng(1))).toBeNull();
    expect(joinRoom(paused, ana, 50_000, () => 0).room.deadline).toBe(50_000 + ROUND_MS);
  });

});

/** A game of Tic-Tac-Toe between Ana and Ben, started at time 0 with Ana going first. */
function ticTacToeRoom(): Room {
  let room = createRoom("ABCDE", "tic-tac-toe", 0);
  for (const player of [ana, ben]) room = joinRoom(room, player, 0, () => 0).room;
  return room;
}

/** Lets the clock run out for whoever's turn it is. */
const runOut = (room: Room) => timeOut(room, room.deadline!, createRng(7))!;

describe("rooms where players take turns", () => {
  it("give every move its own time", () => {
    let room = ticTacToeRoom();
    expect(room.deadline).toBe(TURN_MS);
    room = playMove(room, ana.id, ticTacToe.legalMoves(room.state as never, 0)[0], 5000).room;
    expect(room.deadline).toBe(5000 + TURN_MS);
    expect(snapshotFor(room, ben.id, new Set(), 15_000).timeLeftMs).toBe(TURN_MS - 10_000);
  });

  it("have the bot move for a player whose time runs out", () => {
    const room = ticTacToeRoom();
    expect(timeOut(room, TURN_MS - 1, createRng(7))).toBeNull();
    const { room: next, lastMove } = runOut(room);
    expect(next.moveCount).toBe(1);
    expect(ticTacToe.turn(next.state as never)).toBe(1);
    expect(lastMove).toMatchObject({ seat: 0, moveNumber: 1, timedOut: true });
    expect(next.missed).toEqual([1, 0]);
    expect(next.deadline).toBe(TURN_MS + TURN_MS);
  });

  it("count a player as away after two missed turns, and give them less time", () => {
    let room = ticTacToeRoom();
    room = runOut(room).room;
    room = playMove(room, ben.id, ticTacToe.legalMoves(room.state as never, 1)[0], room.updatedAt + 1000).room;
    room = runOut(room).room;
    expect(isAway(room, 0)).toBe(true);
    expect(snapshotFor(room, ben.id, new Set()).seats[0]?.away).toBe(true);
    room = playMove(room, ben.id, ticTacToe.legalMoves(room.state as never, 1)[0], room.updatedAt + 1000).room;
    expect(room.deadline).toBe(room.updatedAt + AWAY_MS);
  });

  it("stop playing for a player who comes back or moves", () => {
    let room = ticTacToeRoom();
    room = runOut(room).room;
    room = playMove(room, ben.id, ticTacToe.legalMoves(room.state as never, 1)[0], room.updatedAt).room;
    room = runOut(room).room;
    room = playMove(room, ben.id, ticTacToe.legalMoves(room.state as never, 1)[0], room.updatedAt).room;
    const back = comeBack(room, ana.id, room.updatedAt + 2000);
    expect(isAway(back, 0)).toBe(false);
    expect(back.deadline).toBe(room.updatedAt + 2000 + TURN_MS);
    // Someone who isn't away has nothing to come back from.
    expect(comeBack(back, ana.id, 99_999)).toBe(back);
    // Moving counts too.
    const moved = playMove(room, ana.id, ticTacToe.legalMoves(room.state as never, 0)[0], room.updatedAt + 1).room;
    expect(isAway(moved, 0)).toBe(false);
  });

  it("count a turn of several moves as one missed turn, and play the rest of it quickly", () => {
    let room = createRoom("ABCDE", "pig", 0);
    for (const player of [ana, ben]) room = joinRoom(room, player, 0, () => 0).room;
    let { room: next } = runOut(room);
    // Keep running the clock out until the bot hands the turn over.
    while (pig.turn(next.state as never) === 0) {
      expect(next.standIn).toBe(0);
      expect(next.deadline).toBe(next.updatedAt + AWAY_MS);
      next = runOut(next).room;
    }
    expect(next.missed).toEqual([1, 0]);
    expect(next.standIn).toBeNull();
    expect(next.deadline).toBe(next.updatedAt + TURN_MS);
  });

  it("stop the clock once the game is over", () => {
    let room = ticTacToeRoom();
    while (room.state !== null && ticTacToe.result(room.state as never) === null) room = runOut(room).room;
    expect(room.deadline).toBeNull();
  });
});
