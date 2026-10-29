import { checkSeats, nextSeat } from "../engine/seats";
import { IllegalMoveError, type GameResult, type MoveOutcome, type Seat } from "../engine/types";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;

/**
 * The board is a big hexagon made of hexagon tiles. Two players get one with
 * 3 rings of tiles around the middle one (37 tiles), and three or four get 4 rings (61 tiles).
 */
export function radiusFor(players: number): number {
  return players === 2 ? 3 : 4;
}

/** A tile's place on the board, in axial coordinates: q runs left to right, r runs down and to the left. */
export interface Hex {
  q: number;
  r: number;
}

/** The six directions to a neighbouring tile. */
const DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export interface Board {
  radius: number;
  /** Every tile, read in rows from left to right. */
  hexes: readonly Hex[];
  /** The tiles next to each tile. */
  neighbours: readonly (readonly number[])[];
}

function makeBoard(radius: number): Board {
  const hexes: Hex[] = [];
  for (let r = -radius; r <= radius; r++) {
    for (let q = -radius; q <= radius; q++) {
      if (Math.abs(q + r) <= radius) hexes.push({ q, r });
    }
  }
  const index = new Map(hexes.map((hex, i) => [`${hex.q},${hex.r}`, i]));
  const neighbours = hexes.map((hex) =>
    DIRECTIONS.flatMap((d) => {
      const i = index.get(`${hex.q + d.q},${hex.r + d.r}`);
      return i === undefined ? [] : [i];
    }),
  );
  return { radius, hexes, neighbours };
}

const BOARDS = new Map([3, 4].map((radius) => [radius, makeBoard(radius)]));

export function boardFor(radius: number): Board {
  const board = BOARDS.get(radius);
  if (!board) throw new Error(`There's no board with ${radius} rings`);
  return board;
}

/**
 * Where each seat starts, as corners of the board. Seats go round the board
 * clockwise in turn order, and seat 0 starts at the bottom, nearest the player.
 * With the flat-topped tiles the screen draws, (0, R) is the bottom corner.
 */
function startCorners(players: number, radius: number): Hex[] {
  const R = radius;
  if (players === 2) return [{ q: 0, r: R }, { q: 0, r: -R }];
  if (players === 3) return [{ q: 0, r: R }, { q: -R, r: 0 }, { q: R, r: -R }];
  return [
    { q: -R, r: R },
    { q: -R, r: 0 },
    { q: R, r: -R },
    { q: R, r: 0 },
  ];
}

/**
 * How many times each tile has been stepped on. A tile is whole at 0 and
 * cracked at 1. At 2 it holds whoever is on it, and sinks once they step off.
 * Null is a tile that has sunk.
 */
export type Tile = 0 | 1 | 2 | null;

export interface LastMove {
  seat: Seat;
  from: number;
  to: number;
  /** True if the tile they stepped off sank. */
  sank: boolean;
  /** Players who had nowhere to step after this move, and the tile that sank under each, in the order they fell in. */
  fell: { seat: Seat; tile: number }[];
}

export interface TilesState {
  /** How many are playing, from 2 to 4. */
  players: number;
  radius: number;
  tiles: Tile[];
  /** The tile each seat is standing on, or null once they've fallen in. */
  at: (number | null)[];
  /** Seats that fell in, first one first. */
  out: Seat[];
  /** Whose turn it is, or null once only one player is left. */
  turn: Seat | null;
  last: LastMove | null;
  turns: number;
}

/** The tile to step onto. */
export type TilesMove = number;

export type TilesEvent =
  | { type: "step"; seat: Seat; from: number; to: number }
  | { type: "sink"; tile: number }
  | { type: "fall"; seat: Seat; tile: number }
  | { type: "gameOver"; winners: Seat[] };

export function setup(options: { seats?: number; firstSeat?: Seat } = {}): TilesState {
  const { seats = 2, firstSeat = 0 } = options;
  checkSeats("Sinking Tiles", seats, MIN_PLAYERS, MAX_PLAYERS, firstSeat);
  const radius = radiusFor(seats);
  const { hexes } = boardFor(radius);
  const tiles: Tile[] = hexes.map(() => 0);
  const at = startCorners(seats, radius).map((corner) => hexes.findIndex((h) => h.q === corner.q && h.r === corner.r));
  // Standing on your first tile counts as the first step on it.
  for (const tile of at) tiles[tile] = 1;
  return { players: seats, radius, tiles, at, out: [], turn: firstSeat, last: null, turns: 0 };
}

/** The tiles next to `tile` that are still afloat and that nobody is standing on. */
export function openNeighbours(state: Pick<TilesState, "radius" | "tiles" | "at">, tile: number): number[] {
  return boardFor(state.radius).neighbours[tile].filter(
    (next) => state.tiles[next] !== null && !state.at.includes(next),
  );
}

export function legalMoves(state: TilesState, seat: Seat): TilesMove[] {
  const tile = state.at[seat];
  if (state.turn !== seat || tile == null) return [];
  return openNeighbours(state, tile);
}

/** How many tiles a seat could step to right now. 0 for a seat that's out. */
export function openSteps(state: TilesState, seat: Seat): number {
  const tile = state.at[seat];
  return tile == null ? 0 : openNeighbours(state, tile).length;
}

export const playersLeft = (state: TilesState) => state.at.filter((tile) => tile !== null).length;

/**
 * Steps onto a neighbouring tile. Then each player after this one who has
 * nowhere to step falls in, until it's the turn of someone who can move, or
 * only one player is left.
 */
export function play(state: TilesState, seat: Seat, move: TilesMove): MoveOutcome<TilesState, TilesEvent> {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!legalMoves(state, seat).includes(move)) throw new IllegalMoveError(`Seat ${seat} can't step onto tile ${move}`);

  const from = state.at[seat]!;
  const tiles = [...state.tiles];
  const at = [...state.at];
  const out = [...state.out];
  const events: TilesEvent[] = [{ type: "step", seat, from, to: move }];

  tiles[move] = (tiles[move]! + 1) as Tile;
  at[seat] = move;
  const sank = tiles[from] === 2;
  if (sank) {
    tiles[from] = null;
    events.push({ type: "sink", tile: from });
  }

  const fell: LastMove["fell"] = [];
  let turn: Seat | null = null;
  for (let next = nextSeat(seat, state.players); ; next = nextSeat(next, state.players)) {
    if (at.filter((tile) => tile !== null).length <= 1) break;
    const tile = at[next];
    if (tile === null) continue;
    if (openNeighbours({ radius: state.radius, tiles, at }, tile).length > 0) {
      turn = next;
      break;
    }
    // Nowhere to go, so their tile sinks with them on it.
    tiles[tile] = null;
    at[next] = null;
    out.push(next);
    fell.push({ seat: next, tile });
    events.push({ type: "fall", seat: next, tile });
  }

  const next: TilesState = {
    players: state.players,
    radius: state.radius,
    tiles,
    at,
    out,
    turn,
    last: { seat, from, to: move, sank, fell },
    turns: state.turns + 1,
  };
  if (turn === null) events.push({ type: "gameOver", winners: result(next)!.winners });
  return { state: next, events };
}

/** The last player standing wins. Each player scores how many others they outlasted. */
export function result(state: TilesState): GameResult | null {
  if (state.turn !== null) return null;
  const winners = state.at.flatMap((tile, seat) => (tile === null ? [] : [seat]));
  const scores = Array.from({ length: state.players }, (_, seat) => {
    const place = state.out.indexOf(seat);
    return place === -1 ? state.players - 1 : place;
  });
  return { winners, scores };
}
