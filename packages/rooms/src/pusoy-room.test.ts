import { describe, expect, it } from "vitest";
import { createRng, pick } from "@laro/games";
import { legalMoves, type PusoyState, type PusoyView } from "@laro/games/pusoy-dos";
import { createRoom, joinRoom, playMove, RoomError, snapshotFor, timeOut, type Room } from "./room";

const players = ["ana", "ben", "cai", "dee"].map((name) => ({ id: `player-${name}`, name }));

/** A full table of four, dealt at time 0. */
function fullRoom(): Room {
  let room = createRoom("ABCDE", "pusoy-dos", 0, 4);
  for (const player of players) room = joinRoom(room, player, 0, () => 0).room;
  return room;
}

const stateOf = (room: Room) => room.state as PusoyState;

describe("Pusoy Dos rooms", () => {
  it("deal once all four seats are taken, starting with whoever has the lowest card", () => {
    const state = stateOf(fullRoom());
    expect(state.hands.map((hand) => hand.length)).toEqual([13, 13, 13, 13]);
    expect(state.hands[state.turn!]).toContain(state.opening);
  });

  it("send each player their own hand and only how many cards the others hold", () => {
    const room = fullRoom();
    players.forEach((player, seat) => {
      const view = snapshotFor(room, player.id, new Set()).view as PusoyView;
      expect(view.hand).toEqual(stateOf(room).hands[seat]);
      expect(view.counts).toEqual([13, 13, 13, 13]);
      expect("hands" in view).toBe(false);
    });
    expect((snapshotFor(room, "someone-watching", new Set()).view as PusoyView).hand).toBeNull();
  });

  it("turn down cards a player doesn't have", () => {
    const room = fullRoom();
    const seat = stateOf(room).turn!;
    const someoneElses = stateOf(room).hands[(seat + 1) % 4][0];
    expect(() => playMove(room, players[seat].id, [someoneElses], 1)).toThrow(RoomError);
    expect(() => playMove(room, players[seat].id, "3", 1)).toThrow(RoomError);
  });

  it("play a whole game, with the bot playing for anyone whose time runs out", () => {
    const rng = createRng(9);
    let room = fullRoom();
    let timedOut = 0;
    for (let turn = stateOf(room).turn; turn !== null; turn = stateOf(room).turn) {
      if (turn === 2) {
        room = timeOut(room, room.deadline!, rng)!.room;
        timedOut++;
      } else {
        room = playMove(room, players[turn].id, pick(rng, legalMoves(stateOf(room), turn)), room.updatedAt + 1).room;
      }
    }
    expect(timedOut).toBeGreaterThan(0);
    expect(snapshotFor(room, players[0].id, new Set()).phase).toBe("over");
    expect(room.deadline).toBeNull();
  });
});
