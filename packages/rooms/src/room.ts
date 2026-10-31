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
  /**
   * When time runs out for the move being waited on: the round, in games played in rounds against the clock, or the
   * turn, in games that take turns. Null while there's no clock running.
   */
  deadline: number | null;
  /** For each seat, how many turns in a row the bot had to play because time ran out. */
  missed: number[];
  /** A seat whose turn the bot has started playing, because time ran out. It plays the rest of that turn quickly. */
  standIn: Seat | null;
  createdAt: number;
  updatedAt: number;
}

export interface MoveRecord {
  seat: Seat;
  events: unknown[];
  /** Which move of the game this was, starting at 1. */
  moveNumber: number;
  /** True when time ran out and the bot moved for this seat. */
  timedOut?: boolean;
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
  /** `away` is true for a player who missed turns in a row, so the bot plays theirs. */
  seats: ({ name: string; connected: boolean; away: boolean } | null)[];
  phase: Phase;
  /** The game as this player is allowed to see it. */
  view: unknown | null;
  result: GameResult | null;
  /** Seats that asked for another game. */
  rematch: Seat[];
  /** How long is left to make the move being waited on, before the server plays it. */
  timeLeftMs: number | null;
}

/** How long a player has for each move in a game that takes turns, before the bot moves for them. */
export const TURN_MS = 60_000;

/** How long the bot waits before moving for a player who's away, or whose turn it has already started. */
export const AWAY_MS = 8_000;

/** How many turns in a row a player can run out of time on before they count as away. */
export const AWAY_AFTER = 2;

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
    missed: seats.map(() => 0),
    standIn: null,
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
  const started: Room = {
    ...room,
    state,
    firstSeat,
    round: room.round + 1,
    moveCount: 0,
    rematch: [],
    deadline: null,
    missed: room.seats.map(() => 0),
    standIn: null,
  };
  return { ...started, deadline: deadlineFor(started, state, null, now) };
}

/** True for a player who ran out of time on too many turns in a row. */
export function isAway(room: Room, seat: Seat): boolean {
  // Rooms made before there were turn clocks have no count.
  return (room.missed?.[seat] ?? 0) >= AWAY_AFTER;
}

/**
 * When the clock runs out for `state`. In a game played in rounds, it keeps running through a round and starts
 * again for the next one. In a game that takes turns, every move gets its own time, and the bot moves once it's up.
 */
function deadlineFor(room: Room, state: unknown, previous: unknown, now: number): number | null {
  const game = gameFor(room.gameId);
  if (game.result(state) !== null) return null;
  if (game.timer) {
    if (previous !== null && room.deadline != null && game.timer.round(previous) === game.timer.round(state)) {
      return room.deadline;
    }
    return now + game.timer.ms;
  }
  const seat = game.turn(state);
  if (seat === null || !game.bot) return null;
  return now + (isAway(room, seat) || room.standIn === seat ? AWAY_MS : TURN_MS);
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
    // Moving yourself means you're here, so the bot stops playing for you.
    const missed = room.seats.map((_, s) => (s === seat ? 0 : (room.missed?.[s] ?? 0)));
    const next: Room = { ...room, state, moveCount, missed, standIn: null, updatedAt: now };
    return {
      room: { ...next, deadline: deadlineFor(next, state, room.state, now) },
      lastMove: { seat, events, moveNumber: moveCount },
    };
  } catch (error) {
    if (error instanceof IllegalMoveError) throw new RoomError("You can't play that move.");
    throw error;
  }
}

/**
 * Moves once time is up. In a game played in rounds, it plays for everyone who hasn't moved. In a game that takes
 * turns, an easy bot moves for whoever's turn it is. Returns null if there's no clock running out yet.
 */
export function timeOut(room: Room, now: number, rng: Rng): { room: Room; lastMove?: MoveRecord } | null {
  if (room.state === null || room.deadline == null || now < room.deadline) return null;
  const game = gameFor(room.gameId);
  const moveCount = room.moveCount + 1;
  if (game.timer) {
    const { state } = game.timer.timeOut(room.state, rng);
    const deadline = deadlineFor(room, state, room.state, now);
    return { room: { ...room, state, moveCount, deadline, updatedAt: now } };
  }

  const seat = game.turn(room.state);
  if (seat === null || !game.bot) return null;
  const { state, events } = game.play(room.state, seat, game.bot(room.state, seat, { level: "easy", rng }));
  // A turn of several moves counts as one missed turn.
  const missed = room.seats.map((_, s) => {
    const count = room.missed?.[s] ?? 0;
    return s === seat && room.standIn !== seat ? count + 1 : count;
  });
  const standIn = game.turn(state) === seat ? seat : null;
  const next: Room = { ...room, state, moveCount, missed, standIn, updatedAt: now };
  return {
    room: { ...next, deadline: deadlineFor(next, state, room.state, now) },
    lastMove: { seat, events, moveNumber: moveCount, timedOut: true },
  };
}

/** For a player who was away and says they're back: the bot stops playing for them, and they get the full time again. */
export function comeBack(room: Room, playerId: string, now: number): Room {
  const seat = seatOf(room, playerId);
  if (seat === null || (!isAway(room, seat) && room.standIn !== seat)) return room;
  const missed = room.seats.map((_, s) => (s === seat ? 0 : (room.missed?.[s] ?? 0)));
  const next: Room = { ...room, missed, standIn: room.standIn === seat ? null : room.standIn, updatedAt: now };
  const yourTurn = next.state !== null && gameFor(room.gameId).turn(next.state) === seat;
  // A clock that's stopped stays stopped until someone joins.
  return yourTurn && room.deadline != null ? { ...next, deadline: deadlineFor(next, next.state, null, now) } : next;
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
    seats: room.seats.map((player, seat) =>
      player ? { name: player.name, connected: online.has(player.id), away: isAway(room, seat) } : null,
    ),
    phase,
    view: room.state === null ? null : game.view(room.state, you),
    result,
    rematch: room.seats.flatMap((player, seat) => (player && room.rematch.includes(player.id) ? [seat] : [])),
    // Rooms made before there were clocks have no deadline at all.
    timeLeftMs: room.deadline == null ? null : Math.max(0, room.deadline - now),
  };
}
