import { IllegalMoveError, moversOf, type GameResult, type Rng, type Seat } from "@laro/games";
import { gameFor, type GameId } from "./registry";

export interface Player {
  id: string;
  name: string;
}

/** Everything the server keeps about one room. */
export interface Room {
  code: string;
  gameId: GameId;
  /** Who sits where. A null seat is still open. */
  seats: (Player | null)[];
  /** The current game, or null until every seat is filled. */
  state: unknown | null;
  /** How many games have started in this room. */
  round: number;
  /** Moves played in the current game. */
  moveCount: number;
  firstSeat: Seat;
  /** Players asking for another game once one ends. */
  rematch: string[];
  /** When this round's time runs out, for games played in rounds against the clock. Null while there's no clock running. */
  deadline: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface MoveRecord {
  seat: Seat;
  events: unknown[];
  /** Which move of the game this was, starting at 1. */
  moveNumber: number;
}

export type Phase = "waiting" | "playing" | "over";

/** What one player is sent about the room. */
export interface RoomSnapshot {
  code: string;
  gameId: GameId;
  round: number;
  moveCount: number;
  /** The seat of the player receiving this, or null for someone watching. */
  you: Seat | null;
  seats: ({ name: string; connected: boolean } | null)[];
  phase: Phase;
  /** The game as this player is allowed to see it. */
  view: unknown | null;
  result: GameResult | null;
  /** Seats that asked for another game. */
  rematch: Seat[];
  /** How long is left to move this round, for games played against the clock. */
  timeLeftMs: number | null;
}

/** A request that can't be done right now, with a message to show the player. */
export class RoomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RoomError";
  }
}

/**
 * Makes an empty room. `players` is how many seats it has, which has to be a
 * number the game allows. Without it, the room has the fewest the game allows.
 */
export function createRoom(code: string, gameId: GameId, now: number, players?: number): Room {
  const game = gameFor(gameId);
  const size = players ?? game.minSeats;
  if (!Number.isInteger(size) || size < game.minSeats || size > game.maxSeats) {
    throw new RoomError(`${game.name} is played by ${game.minSeats} to ${game.maxSeats} players.`);
  }
  const seats = Array.from({ length: size }, () => null);
  return {
    code,
    gameId,
    seats,
    state: null,
    round: 0,
    moveCount: 0,
    firstSeat: 0,
    rematch: [],
    deadline: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function seatOf(room: Room, playerId: string): Seat | null {
  const seat = room.seats.findIndex((player) => player?.id === playerId);
  return seat === -1 ? null : seat;
}

function startGame(room: Room, firstSeat: Seat, now: number): Room {
  const state = gameFor(room.gameId).setup({ seats: room.seats.length, firstSeat });
  const started = { ...room, state, firstSeat, round: room.round + 1, moveCount: 0, rematch: [], deadline: null };
  return { ...started, deadline: deadlineFor(started, state, null, now) };
}

/**
 * When the clock runs out for `state`, in a game played against the clock.
 * It keeps running through a round and starts again for the next one.
 */
function deadlineFor(room: Room, state: unknown, previous: unknown, now: number): number | null {
  const game = gameFor(room.gameId);
  if (!game.timer || game.result(state) !== null) return null;
  if (previous !== null && room.deadline != null && game.timer.round(previous) === game.timer.round(state)) {
    return room.deadline;
  }
  return now + game.timer.ms;
}

/**
 * Seats a player in the first open seat, or keeps their old seat if they're
 * coming back. Once every seat is taken the first game starts, with a random
 * player going first. Anyone who arrives after that watches.
 */
export function joinRoom(room: Room, player: Player, now: number, rng: Rng): { room: Room; seat: Seat | null } {
  const existing = seatOf(room, player.id);
  if (existing !== null) {
    const seats = room.seats.map((p, i) => (i === existing ? player : p));
    // A clock that stopped while everyone was away starts again.
    const deadline = room.state === null ? null : (room.deadline ?? deadlineFor(room, room.state, null, now));
    return { room: { ...room, seats, deadline, updatedAt: now }, seat: existing };
  }

  const open = room.seats.indexOf(null);
  if (open === -1) return { room, seat: null };

  const seats = room.seats.map((p, i) => (i === open ? player : p));
  let next: Room = { ...room, seats, updatedAt: now };
  if (next.state === null && seats.every(Boolean)) {
    next = startGame(next, Math.floor(rng() * seats.length), now);
  }
  return { room: next, seat: open };
}

export function playMove(
  room: Room,
  playerId: string,
  move: unknown,
  now: number,
): { room: Room; lastMove: MoveRecord } {
  const seat = seatOf(room, playerId);
  if (seat === null) throw new RoomError("You're watching this game, so you can't move.");
  if (room.state === null) throw new RoomError("The game starts once everyone has joined.");

  const game = gameFor(room.gameId);
  if (game.turn(room.state) === null) throw new RoomError("This game is over.");
  if (!moversOf(game, room.state).includes(seat)) {
    throw new RoomError(game.movers ? "You've already moved this round." : "It's not your turn.");
  }
  try {
    const { state, events } = game.play(room.state, seat, move);
    const moveCount = room.moveCount + 1;
    const deadline = deadlineFor(room, state, room.state, now);
    return {
      room: { ...room, state, moveCount, deadline, updatedAt: now },
      lastMove: { seat, events, moveNumber: moveCount },
    };
  } catch (error) {
    if (error instanceof IllegalMoveError) throw new RoomError("You can't play that move.");
    throw error;
  }
}

/**
 * Plays for everyone who hasn't moved when a round's time is up. Returns null
 * if there's no clock running out yet.
 */
export function timeOutRound(room: Room, now: number, rng: Rng): Room | null {
  const timer = gameFor(room.gameId).timer;
  if (!timer || room.state === null || room.deadline == null || now < room.deadline) return null;
  const { state } = timer.timeOut(room.state, rng);
  const deadline = deadlineFor(room, state, room.state, now);
  return { ...room, state, moveCount: room.moveCount + 1, deadline, updatedAt: now };
}

/** Stops the clock, while nobody is there to beat it. Joining starts it again. */
export function pauseClock(room: Room): Room {
  return room.deadline === null ? room : { ...room, deadline: null };
}

/** Records a vote for another game. When every player has voted, the next game starts and the other player goes first. */
export function requestRematch(room: Room, playerId: string, now: number): Room {
  const seat = seatOf(room, playerId);
  if (seat === null) throw new RoomError("Only players can start another game.");
  if (room.state === null || gameFor(room.gameId).result(room.state) === null) {
    throw new RoomError("You can ask for another game once this one ends.");
  }

  const rematch = room.rematch.includes(playerId) ? room.rematch : [...room.rematch, playerId];
  const next = { ...room, rematch, updatedAt: now };
  const everyone = room.seats.every((player) => player !== null && rematch.includes(player.id));
  return everyone ? startGame(next, (room.firstSeat + 1) % room.seats.length, now) : next;
}

export function snapshotFor(
  room: Room,
  playerId: string,
  online: ReadonlySet<string>,
  now = Date.now(),
): RoomSnapshot {
  const game = gameFor(room.gameId);
  const you = seatOf(room, playerId);
  const result = room.state === null ? null : game.result(room.state);
  const phase: Phase = room.state === null ? "waiting" : result === null ? "playing" : "over";
  return {
    code: room.code,
    gameId: room.gameId,
    round: room.round,
    moveCount: room.moveCount,
    you,
    seats: room.seats.map((player) => (player ? { name: player.name, connected: online.has(player.id) } : null)),
    phase,
    view: room.state === null ? null : game.view(room.state, you),
    result,
    rematch: room.seats.flatMap((player, seat) => (player && room.rematch.includes(player.id) ? [seat] : [])),
    // Rooms made before there were clocks have no deadline at all.
    timeLeftMs: room.deadline == null ? null : Math.max(0, room.deadline - now),
  };
}
