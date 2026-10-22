import { newSeed, rollDie, type Rng } from "../engine/rng";
import { checkSeats, nextSeat } from "../engine/seats";
import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

export const LAST_SQUARE = 100;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/** Where each ladder starts and where it leads. */
export const LADDERS: Readonly<Record<number, number>> = {
  3: 22,
  8: 30,
  21: 42,
  28: 76,
  36: 57,
  50: 69,
  71: 92,
  80: 99,
};
/** Where each snake's head is and where its tail drops you. */
export const SNAKES: Readonly<Record<number, number>> = {
  27: 5,
  40: 18,
  47: 26,
  62: 43,
  74: 53,
  87: 56,
  93: 64,
  98: 79,
};

export interface LastRoll {
  seat: Seat;
  roll: number;
  from: number;
  /** The square the roll reached, before any ladder or snake. */
  landed: number;
  to: number;
  jump: "ladder" | "snake" | null;
}

export interface SnakesState {
  /** Each seat's square. 0 is the start, off the board. */
  positions: number[];
  /** Whose turn it is, or null once someone reaches the last square. */
  turn: Seat | null;
  winner: Seat | null;
  /** Where the next roll comes from. */
  seed: number;
  last: LastRoll | null;
  turns: number;
}

/** The only move there is: roll the die. */
export type SnakesMove = "roll";

export type SnakesEvent =
  | { type: "roll"; roll: number }
  | { type: "move"; from: number; to: number }
  | { type: "jump"; from: number; to: number; jump: "ladder" | "snake" }
  | { type: "gameOver"; winner: Seat };

export function setup(options: { seats?: number; firstSeat?: Seat; rng?: Rng } = {}): SnakesState {
  const { seats = 2, firstSeat = 0, rng = Math.random } = options;
  checkSeats("Snakes and Ladders", seats, MIN_PLAYERS, MAX_PLAYERS, firstSeat);
  return { positions: Array(seats).fill(0), turn: firstSeat, winner: null, seed: newSeed(rng), last: null, turns: 0 };
}

export function legalMoves(state: SnakesState, seat: Seat): SnakesMove[] {
  return state.turn === seat ? ["roll"] : [];
}

/**
 * Rolls and moves. A roll that would go past the last square doesn't move at
 * all, so the game ends on an exact roll. Ladders lead up and snakes lead down.
 */
export function play(state: SnakesState, seat: Seat, move: SnakesMove): MoveOutcome<SnakesState, SnakesEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (move !== "roll") throw new IllegalMoveError(`There's no move ${JSON.stringify(move)}`);

  const { roll, seed } = rollDie(state.seed);
  const from = state.positions[seat];
  const landed = from + roll > LAST_SQUARE ? from : from + roll;
  const jump = landed in LADDERS ? "ladder" : landed in SNAKES ? "snake" : null;
  const to = jump === "ladder" ? LADDERS[landed] : jump === "snake" ? SNAKES[landed] : landed;

  const events: SnakesEvent[] = [{ type: "roll", roll }];
  if (landed !== from) events.push({ type: "move", from, to: landed });
  if (jump) events.push({ type: "jump", from: landed, to, jump });
  const positions = state.positions.map((square, s) => (s === seat ? to : square));
  const won = to === LAST_SQUARE;
  if (won) events.push({ type: "gameOver", winner: seat });
  return {
    state: {
      positions,
      turn: won ? null : nextSeat(seat, positions.length),
      winner: won ? seat : null,
      seed,
      last: { seat, roll, from, landed, to, jump },
      turns: state.turns + 1,
    },
    events,
  };
}

export function result(state: SnakesState): GameResult | null {
  if (state.winner === null) return null;
  return { winners: [state.winner], scores: [...state.positions] };
}
