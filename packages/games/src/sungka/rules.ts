import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

export const HOUSES_PER_SIDE = 7;
export const STARTING_SHELLS = 7;
export const BOARD_SIZE = 16;
export const TOTAL_SHELLS = HOUSES_PER_SIDE * STARTING_SHELLS * 2;

/**
 * The board is a ring of 16 slots:
 *   0–6   seat 0's houses
 *   7     seat 0's store (the "ulo", on that player's left)
 *   8–14  seat 1's houses
 *   15    seat 1's store
 * Shells travel up the indexes, which is clockwise on screen, and skip the other player's store.
 */
export interface SungkaState {
  board: number[];
  /** Whose turn it is, or null once every shell is in a store. */
  turn: Seat | null;
  /** How many turns have been played. */
  turns: number;
}

/** The index of the house to pick up from. */
export type SungkaMove = number;

export type SungkaEvent =
  | { type: "pickup"; slot: number; count: number }
  | { type: "drop"; slot: number }
  /** The last shell and everything in the house across from it go to the store. */
  | { type: "capture"; from: [number, number]; store: number; count: number }
  | { type: "extraTurn"; seat: Seat }
  /** The seat had no shells on its side, so its turn was skipped. */
  | { type: "pass"; seat: Seat }
  | { type: "gameOver" };

export function storeOf(seat: Seat): number {
  return seat === 0 ? 7 : 15;
}

export function housesOf(seat: Seat): number[] {
  const first = seat === 0 ? 0 : 8;
  return Array.from({ length: HOUSES_PER_SIDE }, (_, i) => first + i);
}

/** Which seat a slot belongs to. Stores belong to their owner too. */
export function ownerOf(slot: number): Seat {
  return slot < 8 ? 0 : 1;
}

export function isStore(slot: number): boolean {
  return slot === 7 || slot === 15;
}

/** The house directly across the board. */
export function oppositeOf(house: number): number {
  return 14 - house;
}

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function shellsOnSide(board: readonly number[], seat: Seat): number {
  const first = seat === 0 ? 0 : 8;
  let total = 0;
  for (let i = first; i < first + HOUSES_PER_SIDE; i++) total += board[i];
  return total;
}

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): SungkaState {
  const { seats = 2, firstSeat = 0 } = options;
  if (seats !== 2) throw new Error("Sungka is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Sungka`);
  const board = Array.from({ length: BOARD_SIZE }, (_, slot) => (isStore(slot) ? 0 : STARTING_SHELLS));
  return { board, turn: firstSeat, turns: 0 };
}

export function legalMoves(state: SungkaState, seat: Seat): SungkaMove[] {
  if (state.turn !== seat) return [];
  return housesOf(seat).filter((house) => state.board[house] > 0);
}

/**
 * Sows from a house, changing the board in place:
 * - Drop one shell in each slot, skipping the other player's store.
 * - Last shell lands in your store: you go again.
 * - Last shell lands in a house that already had shells: pick them all up and keep going.
 * - Last shell lands in an empty house on your side: take it and the shells across from it.
 * - Last shell lands in an empty house on the other side: your turn ends.
 *
 * Returns true when the last shell landed in the player's own store.
 */
export function sow(board: number[], seat: Seat, house: number, events?: SungkaEvent[]): boolean {
  const ownStore = storeOf(seat);
  const otherStore = storeOf(otherSeat(seat));
  let slot = house;
  let hand = board[slot];
  board[slot] = 0;
  events?.push({ type: "pickup", slot, count: hand });

  // Every turn adds at least one shell to a store, so this always ends. The guard catches bugs.
  for (let laps = 0; laps < 10_000; laps++) {
    while (hand > 0) {
      slot = (slot + 1) % BOARD_SIZE;
      if (slot === otherStore) continue;
      board[slot]++;
      hand--;
      events?.push({ type: "drop", slot });
    }

    if (slot === ownStore) return true;

    if (board[slot] > 1) {
      hand = board[slot];
      board[slot] = 0;
      events?.push({ type: "pickup", slot, count: hand });
      continue;
    }

    if (ownerOf(slot) === seat) {
      const across = oppositeOf(slot);
      const count = board[across] + 1;
      board[across] = 0;
      board[slot] = 0;
      board[ownStore] += count;
      events?.push({ type: "capture", from: [slot, across], store: ownStore, count });
    }
    return false;
  }
  throw new Error("Sowing never finished");
}

/**
 * Decides who moves next after `seat` finishes sowing. A player with no shells
 * on their side is skipped. When neither side has shells, the game is over.
 */
export function nextTurn(
  board: readonly number[],
  seat: Seat,
  endedInStore: boolean,
  events?: SungkaEvent[],
): Seat | null {
  const preferred = endedInStore ? seat : otherSeat(seat);
  if (shellsOnSide(board, preferred) > 0) {
    if (endedInStore) events?.push({ type: "extraTurn", seat });
    return preferred;
  }
  const fallback = otherSeat(preferred);
  if (shellsOnSide(board, fallback) > 0) {
    events?.push({ type: "pass", seat: preferred });
    return fallback;
  }
  events?.push({ type: "gameOver" });
  return null;
}

export function play(state: SungkaState, seat: Seat, house: SungkaMove): MoveOutcome<SungkaState, SungkaEvent> {
  if (state.turn === null) throw new IllegalMoveError("The game is already over");
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Number.isInteger(house) || !housesOf(seat).includes(house)) {
    throw new IllegalMoveError(`Seat ${seat} can't play from slot ${house}`);
  }
  if (state.board[house] === 0) throw new IllegalMoveError(`House ${house} is empty`);

  const board = state.board.slice();
  const events: SungkaEvent[] = [];
  const endedInStore = sow(board, seat, house, events);
  const turn = nextTurn(board, seat, endedInStore, events);
  return { state: { board, turn, turns: state.turns + 1 }, events };
}

export function result(state: SungkaState): GameResult | null {
  if (state.turn !== null) return null;
  const scores = [state.board[storeOf(0)], state.board[storeOf(1)]];
  if (scores[0] === scores[1]) return { winners: [], scores };
  return { winners: [scores[0] > scores[1] ? 0 : 1], scores };
}

/** Applies one event to a board, so a screen can replay a move step by step. */
export function applyEvent(board: readonly number[], event: SungkaEvent): number[] {
  const next = board.slice();
  switch (event.type) {
    case "pickup":
      next[event.slot] = 0;
      break;
    case "drop":
      next[event.slot]++;
      break;
    case "capture":
      next[event.from[0]] = 0;
      next[event.from[1]] = 0;
      next[event.store] += event.count;
      break;
  }
  return next;
}
