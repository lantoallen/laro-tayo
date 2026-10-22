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

/** How a finished turn went. */
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
  /** The roll the player whose turn it is is moving by, and how many squares are left. Null until they roll. */
  moving: { roll: number; left: number } | null;
  /** The last turn to finish. */
  last: LastRoll | null;
  /** The move that led here. */
  lastMove: SnakesMove | null;
  /** Rolls so far. */
  rolls: number;
  /** Finished turns. */
  turns: number;
}

/**
 * A turn is played the way it is on a real board: roll the die, move your
 * piece one square at a time, then climb the ladder or slide down the snake
 * you landed on.
 */
export type SnakesMove = "roll" | "step" | "jump";

export type SnakesEvent =
  | { type: "roll"; roll: number }
  | { type: "move"; from: number; to: number }
  | { type: "jump"; from: number; to: number; jump: "ladder" | "snake" }
  | { type: "gameOver"; winner: Seat };

export function setup(options: { seats?: number; firstSeat?: Seat; rng?: Rng } = {}): SnakesState {
  const { seats = 2, firstSeat = 0, rng = Math.random } = options;
  checkSeats("Snakes and Ladders", seats, MIN_PLAYERS, MAX_PLAYERS, firstSeat);
  return {
    positions: Array(seats).fill(0),
    turn: firstSeat,
    winner: null,
    seed: newSeed(rng),
    moving: null,
    last: null,
    lastMove: null,
    rolls: 0,
    turns: 0,
  };
}

/** The ladder or snake starting on a square, if any. */
export function jumpFrom(square: number): { jump: "ladder" | "snake"; to: number } | null {
  if (square in LADDERS) return { jump: "ladder", to: LADDERS[square] };
  if (square in SNAKES) return { jump: "snake", to: SNAKES[square] };
  return null;
}

/** What the player whose turn it is has to do next. There's only ever one thing. */
export function nextMove(state: SnakesState): SnakesMove | null {
  if (state.turn === null) return null;
  if (state.moving === null) return "roll";
  return state.moving.left > 0 ? "step" : "jump";
}

export function legalMoves(state: SnakesState, seat: Seat): SnakesMove[] {
  const move = nextMove(state);
  return state.turn === seat && move ? [move] : [];
}

/**
 * Rolls, steps one square, or follows a ladder or snake. A roll that would go
 * past the last square doesn't move at all, so the game ends on an exact roll.
 */
export function play(state: SnakesState, seat: Seat, move: SnakesMove): MoveOutcome<SnakesState, SnakesEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  const expected = nextMove(state);
  if (move !== expected) throw new IllegalMoveError(`Seat ${seat} has to ${expected} now, not ${JSON.stringify(move)}`);
  const square = state.positions[seat];

  if (move === "roll") {
    const { roll, seed } = rollDie(state.seed);
    const rolled = { ...state, seed, rolls: state.rolls + 1, lastMove: move };
    const events: SnakesEvent[] = [{ type: "roll", roll }];
    if (square + roll > LAST_SQUARE) {
      return endTurn(rolled, { seat, roll, from: square, landed: square, to: square, jump: null }, events);
    }
    return { state: { ...rolled, moving: { roll, left: roll } }, events };
  }

  const { roll, left } = state.moving!;
  if (move === "step") {
    const to = square + 1;
    const stepped = { ...state, positions: moveTo(state.positions, seat, to), lastMove: move };
    const events: SnakesEvent[] = [{ type: "move", from: square, to }];
    // Keep going, or stop on a ladder or snake until it's followed.
    if (left > 1 || jumpFrom(to)) return { state: { ...stepped, moving: { roll, left: left - 1 } }, events };
    return endTurn(stepped, { seat, roll, from: to - roll, landed: to, to, jump: null }, events);
  }

  const { jump, to } = jumpFrom(square)!;
  const jumped = { ...state, positions: moveTo(state.positions, seat, to), lastMove: move };
  const events: SnakesEvent[] = [{ type: "jump", from: square, to, jump }];
  return endTurn(jumped, { seat, roll, from: square - roll, landed: square, to, jump }, events);
}

function moveTo(positions: number[], seat: Seat, to: number): number[] {
  return positions.map((square, s) => (s === seat ? to : square));
}

/** Passes the turn on, or ends the game if the player reached the last square. */
function endTurn(state: SnakesState, last: LastRoll, events: SnakesEvent[]): MoveOutcome<SnakesState, SnakesEvent> {
  const won = last.to === LAST_SQUARE;
  if (won) events.push({ type: "gameOver", winner: last.seat });
  return {
    state: {
      ...state,
      turn: won ? null : nextSeat(last.seat, state.positions.length),
      winner: won ? last.seat : null,
      moving: null,
      last,
      turns: state.turns + 1,
    },
    events,
  };
}

export function result(state: SnakesState): GameResult | null {
  if (state.winner === null) return null;
  return { winners: [state.winner], scores: [...state.positions] };
}
