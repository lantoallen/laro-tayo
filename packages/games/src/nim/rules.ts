import type { Rng } from "../engine/rng";
import { checkSeats, nextSeat } from "../engine/seats";
import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

/** How many sticks each pile starts with. With these, the player who goes first can always win. */
export const START_PILES: readonly number[] = [3, 4, 5];
export const PLAYERS = 2;

/** Take `count` sticks from one pile. */
export interface NimMove {
  pile: number;
  count: number;
}

export interface NimState {
  piles: number[];
  /** Whose turn it is, or null once the last stick is gone. */
  turn: Seat | null;
  /** Whoever took the last stick. */
  winner: Seat | null;
  /** How many sticks each seat has taken. */
  taken: number[];
  last: (NimMove & { seat: Seat }) | null;
  turns: number;
}

export type NimEvent = { type: "take"; pile: number; count: number } | { type: "gameOver"; winner: Seat };

export function setup(options: { seats?: number; firstSeat?: Seat; rng?: Rng } = {}): NimState {
  const { seats = PLAYERS, firstSeat = 0 } = options;
  checkSeats("Nim", seats, PLAYERS, PLAYERS, firstSeat);
  return { piles: [...START_PILES], turn: firstSeat, winner: null, taken: [0, 0], last: null, turns: 0 };
}

export function legalMoves(state: NimState, seat: Seat): NimMove[] {
  if (state.turn !== seat) return [];
  return state.piles.flatMap((size, pile) =>
    Array.from({ length: size }, (_, i) => ({ pile, count: i + 1 })),
  );
}

/** Takes sticks from one pile. Whoever takes the last stick of all wins. */
export function play(state: NimState, seat: Seat, move: NimMove): MoveOutcome<NimState, NimEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  const size = typeof move === "object" && move !== null ? state.piles[move.pile] : undefined;
  if (!Number.isInteger(move?.count) || size === undefined || move.count < 1 || move.count > size) {
    throw new IllegalMoveError(`You can't take ${JSON.stringify(move)}`);
  }
  const piles = state.piles.map((old, pile) => (pile === move.pile ? old - move.count : old));
  const taken = state.taken.map((old, s) => (s === seat ? old + move.count : old));
  const last = { seat, pile: move.pile, count: move.count };
  const turns = state.turns + 1;
  const events: NimEvent[] = [{ type: "take", pile: move.pile, count: move.count }];
  if (piles.every((pile) => pile === 0)) {
    events.push({ type: "gameOver", winner: seat });
    return { state: { piles, turn: null, winner: seat, taken, last, turns }, events };
  }
  return { state: { piles, turn: nextSeat(seat, PLAYERS), winner: null, taken, last, turns }, events };
}

export function view(state: NimState): NimState {
  return state;
}

export function result(state: NimState): GameResult | null {
  if (state.winner === null) return null;
  return { winners: [state.winner], scores: [...state.taken] };
}
