import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";
import type { Rng } from "../engine/rng";

export const COLUMNS = 5;
export const ROWS = 6;
export const CARDS = COLUMNS * ROWS;
/** 15 pairs, an odd number, so a game can't end in a tie. */
export const PAIRS = CARDS / 2;
/** What a hidden card's face looks like in a player's view. */
export const HIDDEN = -1;

export interface LastTurn {
  seat: Seat;
  matched: boolean;
}

/** Cards are read left to right from the top row. */
export interface MemoryState {
  /** The face on each card, from 0 to PAIRS - 1. A view shows HIDDEN for cards that are face down. */
  faces: number[];
  /** Who took each card, or null while it's still on the table. */
  owner: (Seat | null)[];
  /** The cards turned up so far this turn: none or one. */
  flipped: number[];
  /** The two cards that didn't match on the last turn. They stay up until the next card is turned. */
  missed: number[];
  /** Cards that have been face up at some point, which is what a good memory could know. */
  seen: boolean[];
  /** Whose turn it is, or null once every pair is taken. */
  turn: Seat | null;
  last: LastTurn | null;
  turns: number;
}

/** The card to turn over. */
export type MemoryMove = number;

export type MemoryEvent =
  | { type: "flip"; card: number; face: number }
  | { type: "match"; cards: number[] }
  | { type: "miss"; cards: number[] }
  | { type: "gameOver"; winner: Seat | null };

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

export function setup(options: { seats?: number; firstSeat?: Seat; rng?: Rng } = {}): MemoryState {
  const { seats = 2, firstSeat = 0, rng = Math.random } = options;
  if (seats !== 2) throw new Error("Memory is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Memory`);
  const faces = Array.from({ length: CARDS }, (_, i) => i % PAIRS);
  for (let i = faces.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [faces[i], faces[j]] = [faces[j], faces[i]];
  }
  return {
    faces,
    owner: Array(CARDS).fill(null),
    flipped: [],
    missed: [],
    seen: Array(CARDS).fill(false),
    turn: firstSeat,
    last: null,
    turns: 0,
  };
}

/** Whether everyone can see a card's face right now. */
export function isFaceUp(state: MemoryState, card: number): boolean {
  return state.owner[card] !== null || state.flipped.includes(card) || state.missed.includes(card);
}

/** Cards that can be turned over: still on the table and not already up this turn. */
export function legalMoves(state: MemoryState, seat: Seat): MemoryMove[] {
  if (state.turn !== seat) return [];
  return state.owner.flatMap((owner, card) => (owner === null && !state.flipped.includes(card) ? [card] : []));
}

export function countPairs(owner: readonly (Seat | null)[], seat: Seat): number {
  return owner.filter((o) => o === seat).length / 2;
}

/** The seat with more pairs, or null for a tie. */
function leader(owner: readonly (Seat | null)[]): Seat | null {
  const difference = countPairs(owner, 0) - countPairs(owner, 1);
  return difference === 0 ? null : difference > 0 ? 0 : 1;
}

/**
 * Turns a card over. The second card of a turn either matches the first, and
 * the player keeps both and goes again, or it doesn't and the turn passes.
 */
export function play(state: MemoryState, seat: Seat, move: MemoryMove): MoveOutcome<MemoryState, MemoryEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Number.isInteger(move) || move < 0 || move >= CARDS) throw new IllegalMoveError(`There's no card ${move}`);
  if (state.owner[move] !== null) throw new IllegalMoveError(`Card ${move} has already been taken`);
  if (state.flipped.includes(move)) throw new IllegalMoveError(`Card ${move} is already face up`);

  const seen = [...state.seen];
  seen[move] = true;
  const events: MemoryEvent[] = [{ type: "flip", card: move, face: state.faces[move] }];

  if (state.flipped.length === 0) {
    return { state: { ...state, flipped: [move], missed: [], seen, last: null, turns: state.turns + 1 }, events };
  }

  const pair = [state.flipped[0], move];
  const matched = state.faces[pair[0]] === state.faces[pair[1]];
  const owner = [...state.owner];
  if (matched) {
    for (const card of pair) owner[card] = seat;
    events.push({ type: "match", cards: pair });
  } else {
    events.push({ type: "miss", cards: pair });
  }
  const over = owner.every((o) => o !== null);
  if (over) events.push({ type: "gameOver", winner: leader(owner) });
  return {
    state: {
      ...state,
      owner,
      flipped: [],
      missed: matched ? [] : pair,
      seen,
      turn: over ? null : matched ? seat : otherSeat(seat),
      last: { seat, matched },
      turns: state.turns + 1,
    },
    events,
  };
}

/** What anyone may see: the faces of cards that are up. Cards that are down show HIDDEN. */
export function view(state: MemoryState): MemoryState {
  return { ...state, faces: state.faces.map((face, card) => (isFaceUp(state, card) ? face : HIDDEN)) };
}

export function result(state: MemoryState): GameResult | null {
  if (state.turn !== null) return null;
  const winner = leader(state.owner);
  return { winners: winner === null ? [] : [winner], scores: [countPairs(state.owner, 0), countPairs(state.owner, 1)] };
}
