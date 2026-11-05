import { describe, expect, it } from "vitest";
import { createRng } from "@laro/games";
import { GAMES, gameFor, type GameId } from "./registry";
import { createRoom, joinRoom, playMove, snapshotFor, timeOut, type Room } from "./room";

/** A full room at the largest table the game allows, so a game added to the registry is covered without a new test. */
function fullRoom(id: GameId): Room {
  const game = gameFor(id);
  let room = createRoom("ABCDE", id, 0, game.maxSeats);
  for (let seat = 0; seat < game.maxSeats; seat++) {
    room = joinRoom(room, { id: `player-${seat}`, name: `Player ${seat}` }, 1, () => 0).room;
  }
  return room;
}

describe.each(Object.keys(GAMES) as GameId[])("%s", (id) => {
  const game = gameFor(id);

  it("starts once every seat is taken, and each seat sees a view of the game", () => {
    const room = fullRoom(id);
    expect(room.state).not.toBeNull();
    for (let seat = 0; seat < game.maxSeats; seat++) {
      expect(snapshotFor(room, `player-${seat}`, new Set()).view).toEqual(game.view(room.state, seat));
    }
  });

  it("plays to the end when the room's bot moves for anyone who runs out of time", () => {
    const rng = createRng(21);
    let room = fullRoom(id);
    for (let step = 0; step < 5000 && game.turn(room.state) !== null; step++) {
      const next = timeOut(room, room.deadline ?? 0, rng);
      if (next) room = next.room;
      else {
        // Games with no clock, like Hulaan Mo's turns in a room, are moved by their players.
        const seat = game.turn(room.state)!;
        const moves = game.legalMoves(room.state, seat);
        room = playMove(room, `player-${seat}`, moves[Math.floor(rng() * moves.length)], room.updatedAt + 1).room;
      }
    }
    expect(game.turn(room.state)).toBeNull();
    expect(game.result(room.state)).not.toBeNull();
    expect(room.deadline).toBeNull();
  });
});
