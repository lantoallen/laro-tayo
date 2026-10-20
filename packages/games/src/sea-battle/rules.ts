import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";
import type { Rng } from "../engine/rng";

export const SIZE = 10;
export const CELLS = SIZE * SIZE;
/** The length of each ship in a fleet, biggest first. */
export const FLEET = [5, 4, 3, 3, 2] as const;
export const SHIP_NAMES = ["carrier", "battleship", "cruiser", "submarine", "destroyer"] as const;

/** The cells a ship covers, or null in a view where the ship is still hidden. */
export type Ship = number[] | null;
export type Shot = "hit" | "miss" | null;

export interface LastShot {
  seat: Seat;
  cell: number;
  hit: boolean;
  /** The ship this shot sank, as an index into FLEET. */
  sunk: number | null;
}

/** Cells are read left to right from the top row of each player's waters. */
export interface SeaState {
  /** Each seat's ships, in FLEET order. */
  fleets: [Ship[], Ship[]];
  /** Where each seat has fired into the other seat's waters, and what it hit. */
  shots: [Shot[], Shot[]];
  /** Whose turn it is, or null once a fleet is sunk. */
  turn: Seat | null;
  winner: Seat | null;
  last: LastShot | null;
  turns: number;
}

/** The cell to fire at in the other player's waters. */
export type SeaMove = number;

export type SeaEvent =
  | { type: "shot"; cell: number; hit: boolean }
  | { type: "sunk"; ship: number; cells: number[] }
  | { type: "gameOver"; winner: Seat };

export const rowOf = (cell: number) => Math.floor(cell / SIZE);
export const colOf = (cell: number) => cell % SIZE;

export function otherSeat(seat: Seat): Seat {
  return seat === 0 ? 1 : 0;
}

/** A cell and the eight around it that are on the board. */
export function around(cell: number): number[] {
  const cells: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const row = rowOf(cell) + dr;
      const col = colOf(cell) + dc;
      if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) cells.push(row * SIZE + col);
    }
  }
  return cells;
}

/** The cells of a ship of `length` starting at `start`, or null if it would run off the board. */
export function shipCells(start: number, length: number, across: boolean): number[] | null {
  const row = rowOf(start);
  const col = colOf(start);
  if (across ? col + length > SIZE : row + length > SIZE) return null;
  return Array.from({ length }, (_, i) => (across ? start + i : start + i * SIZE));
}

/** Places a fleet at random. Ships don't overlap or touch, even at the corners. */
export function randomFleet(rng: Rng): number[][] {
  for (;;) {
    const blocked = new Set<number>();
    const fleet: number[][] = [];
    for (const length of FLEET) {
      let placed: number[] | null = null;
      for (let attempt = 0; attempt < 200 && placed === null; attempt++) {
        const cells = shipCells(Math.floor(rng() * CELLS), length, rng() < 0.5);
        if (cells && cells.every((cell) => !blocked.has(cell))) placed = cells;
      }
      if (placed === null) break;
      fleet.push(placed);
      for (const cell of placed) for (const near of around(cell)) blocked.add(near);
    }
    if (fleet.length === FLEET.length) return fleet;
  }
}

export function setup(options: { seats?: number; firstSeat?: Seat; rng?: Rng } = {}): SeaState {
  const { seats = 2, firstSeat = 0, rng = Math.random } = options;
  if (seats !== 2) throw new Error("Sea Battle is played by exactly 2 players");
  if (firstSeat !== 0 && firstSeat !== 1) throw new Error(`No seat ${firstSeat} in Sea Battle`);
  return {
    fleets: [randomFleet(rng), randomFleet(rng)],
    shots: [Array(CELLS).fill(null), Array(CELLS).fill(null)],
    turn: firstSeat,
    winner: null,
    last: null,
    turns: 0,
  };
}

/** Whether every cell of a ship has been hit. `shots` are the other player's shots at its fleet. */
export function isSunk(ship: Ship, shots: readonly Shot[]): boolean {
  return ship !== null && ship.every((cell) => shots[cell] === "hit");
}

/** Ships a seat still has afloat. Hidden ships count, since they can't have been sunk. */
export function shipsLeft(state: SeaState, seat: Seat): number {
  const shots = state.shots[otherSeat(seat)];
  return state.fleets[seat].filter((ship) => !isSunk(ship, shots)).length;
}

export function legalMoves(state: SeaState, seat: Seat): SeaMove[] {
  if (state.turn !== seat) return [];
  return state.shots[seat].flatMap((shot, cell) => (shot === null ? [cell] : []));
}

/** Fires at a cell. Players take turns one shot at a time, and sinking the whole fleet wins. */
export function play(state: SeaState, seat: Seat, move: SeaMove): MoveOutcome<SeaState, SeaEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!Number.isInteger(move) || move < 0 || move >= CELLS) throw new IllegalMoveError(`There's no cell ${move}`);
  if (state.shots[seat][move] !== null) throw new IllegalMoveError(`Cell ${move} has already been fired at`);

  const other = otherSeat(seat);
  const fleet = state.fleets[other];
  const target = fleet.findIndex((ship) => ship?.includes(move));
  const hit = target !== -1;
  const mine = [...state.shots[seat]];
  mine[move] = hit ? "hit" : "miss";
  const shots: [Shot[], Shot[]] = seat === 0 ? [mine, state.shots[1]] : [state.shots[0], mine];

  const events: SeaEvent[] = [{ type: "shot", cell: move, hit }];
  const sunk = hit && isSunk(fleet[target], mine) ? target : null;
  if (sunk !== null) events.push({ type: "sunk", ship: sunk, cells: fleet[sunk]! });
  const won = fleet.every((ship) => isSunk(ship, mine));
  if (won) events.push({ type: "gameOver", winner: seat });
  return {
    state: {
      ...state,
      shots,
      turn: won ? null : other,
      winner: won ? seat : null,
      last: { seat, cell: move, hit, sunk },
      turns: state.turns + 1,
    },
    events,
  };
}

/**
 * What one seat may see: its own fleet, and only the sunk ships of the other.
 * Someone watching (seat null) sees only sunk ships.
 */
export function view(state: SeaState, seat: Seat | null): SeaState {
  const hide = (owner: Seat): Ship[] =>
    owner === seat || state.turn === null
      ? state.fleets[owner]
      : state.fleets[owner].map((ship) => (isSunk(ship, state.shots[otherSeat(owner)]) ? ship : null));
  return { ...state, fleets: [hide(0), hide(1)] };
}

export function result(state: SeaState): GameResult | null {
  if (state.turn === null && state.winner !== null) {
    return { winners: [state.winner], scores: [shipsLeft(state, 0), shipsLeft(state, 1)] };
  }
  return null;
}
