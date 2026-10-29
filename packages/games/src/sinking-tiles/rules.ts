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
  if (players === 2)
    return [
      { q: 0, r: R },
      { q: 0, r: -R },
    ];
  if (players === 3)
    return [
      { q: 0, r: R },
      { q: -R, r: 0 },
      { q: R, r: -R },
    ];
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

/**
 * "turns": players take turns stepping. "together": everyone picks a tile in
 * secret, then all the pieces move at once.
 */
export type TilesMode = "turns" | "together";

/** How long players have to pick in each round of "together", on a server or against bots. */
export const ROUND_MS = 10_000;

/** What happened on the last move, or in the last round when everyone moves at once. */
export interface LastMove {
  /** Who stepped where. One step when taking turns, and everyone who moved in a round otherwise. */
  steps: { seat: Seat; from: number; to: number }[];
  /** Tiles that more than one player picked in the same round. Those players stayed put, and the tile cracked. */
  bumps: { tile: number; seats: Seat[] }[];
  /** Tiles that sank, apart from the ones under players who fell in. */
  sank: number[];
  /** Players who had nowhere to step afterwards, and the tile that sank under each, in the order they fell in. */
  fell: { seat: Seat; tile: number }[];
}

/** A pick in a player's view: a tile, "hidden" for someone else's pick, or null before they've picked. */
export type TilePick = number | "hidden" | null;

export interface TilesState {
  mode: TilesMode;
  /** How many are playing, from 2 to 4. */
  players: number;
  radius: number;
  tiles: Tile[];
  /** The tile each seat is standing on, or null once they've fallen in. */
  at: (number | null)[];
  /** Seats that fell in, first one first. */
  out: Seat[];
  /** For each seat that fell in, how many players were already out by then. Players who fall together share a place. */
  placed: (number | null)[];
  /**
   * Whose turn it is, or null once the game is over. When everyone moves at
   * once, the first seat that still has to pick.
   */
  turn: Seat | null;
  /** This round's picks, when everyone moves at once. Always empty picks when taking turns. */
  picks: TilePick[];
  /** Rounds played when everyone moves at once. */
  round: number;
  last: LastMove | null;
  turns: number;
}

/** The tile to step onto. */
export type TilesMove = number;

export type TilesEvent =
  | { type: "pick"; seat: Seat }
  | { type: "step"; seat: Seat; from: number; to: number }
  | { type: "bump"; tile: number; seats: Seat[] }
  | { type: "sink"; tile: number }
  | { type: "fall"; seat: Seat; tile: number }
  | { type: "gameOver"; winners: Seat[] };

export function setup(options: { seats?: number; firstSeat?: Seat; mode?: TilesMode } = {}): TilesState {
  const { seats = 2, firstSeat = 0, mode = "turns" } = options;
  checkSeats("Sinking Tiles", seats, MIN_PLAYERS, MAX_PLAYERS, firstSeat);
  const radius = radiusFor(seats);
  const { hexes } = boardFor(radius);
  const tiles: Tile[] = hexes.map(() => 0);
  const at = startCorners(seats, radius).map((corner) => hexes.findIndex((h) => h.q === corner.q && h.r === corner.r));
  // Standing on your first tile counts as the first step on it.
  for (const tile of at) tiles[tile] = 1;
  return {
    mode,
    players: seats,
    radius,
    tiles,
    at,
    out: [],
    placed: at.map(() => null),
    // Everyone picks at once, so nobody goes first.
    turn: mode === "together" ? 0 : firstSeat,
    picks: at.map(() => null),
    round: 0,
    last: null,
    turns: 0,
  };
}

/** The tiles next to `tile` that are still afloat and that nobody is standing on. */
export function openNeighbours(state: Pick<TilesState, "radius" | "tiles" | "at">, tile: number): number[] {
  return boardFor(state.radius).neighbours[tile].filter(
    (next) => state.tiles[next] !== null && !state.at.includes(next),
  );
}

/** Seats that can move now: whoever's turn it is, or everyone still to pick when moving at once. */
export function movers(state: TilesState): Seat[] {
  if (state.turn === null) return [];
  if (state.mode === "turns") return [state.turn];
  return state.at.flatMap((tile, seat) => (tile !== null && state.picks[seat] === null ? [seat] : []));
}

export function legalMoves(state: TilesState, seat: Seat): TilesMove[] {
  const tile = state.at[seat];
  if (tile == null || !movers(state).includes(seat)) return [];
  return openNeighbours(state, tile);
}

/** How many tiles a seat could step to right now. 0 for a seat that's out. */
export function openSteps(state: TilesState, seat: Seat): number {
  const tile = state.at[seat];
  return tile == null ? 0 : openNeighbours(state, tile).length;
}

export const playersLeft = (state: TilesState) => state.at.filter((tile) => tile !== null).length;

/** Moves a seat onto a tile, cracking it, and sinks the tile they left if it had been stepped on twice. */
function step(tiles: Tile[], at: (number | null)[], seat: Seat, to: number, last: LastMove, events: TilesEvent[]) {
  const from = at[seat]!;
  tiles[to] = (tiles[to]! + 1) as Tile;
  at[seat] = to;
  last.steps.push({ seat, from, to });
  events.push({ type: "step", seat, from, to });
  if (tiles[from] === 2) {
    tiles[from] = null;
    last.sank.push(from);
    events.push({ type: "sink", tile: from });
  }
}

/** Drops a seat with nowhere to step: their tile sinks with them on it. */
function fall(next: TilesState, seat: Seat, last: LastMove, events: TilesEvent[], placed: number) {
  const tile = next.at[seat]!;
  next.tiles[tile] = null;
  next.at[seat] = null;
  next.out.push(seat);
  next.placed[seat] = placed;
  last.fell.push({ seat, tile });
  events.push({ type: "fall", seat, tile });
}

/** A copy of the parts of the state a move changes. */
function copy(state: TilesState): TilesState {
  return {
    ...state,
    tiles: [...state.tiles],
    at: [...state.at],
    out: [...state.out],
    placed: [...state.placed],
    picks: [...state.picks],
    turns: state.turns + 1,
  };
}

const emptyLast = (): LastMove => ({ steps: [], bumps: [], sank: [], fell: [] });

/**
 * Taking turns, steps onto a neighbouring tile. Then each player after this
 * one who has nowhere to step falls in, until it's the turn of someone who
 * can move, or only one player is left.
 *
 * Moving at once, records a pick. Once everyone has picked, the round is played.
 */
export function play(state: TilesState, seat: Seat, move: TilesMove): MoveOutcome<TilesState, TilesEvent> {
  if (!movers(state).includes(seat)) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (!legalMoves(state, seat).includes(move)) throw new IllegalMoveError(`Seat ${seat} can't step onto tile ${move}`);
  return state.mode === "together" ? pick(state, seat, move) : takeTurn(state, seat, move);
}

function takeTurn(state: TilesState, seat: Seat, move: TilesMove): MoveOutcome<TilesState, TilesEvent> {
  const next = copy(state);
  const last = emptyLast();
  const events: TilesEvent[] = [];
  step(next.tiles, next.at, seat, move, last, events);

  next.turn = null;
  for (let other = nextSeat(seat, state.players); ; other = nextSeat(other, state.players)) {
    if (playersLeft(next) <= 1) break;
    const tile = next.at[other];
    if (tile === null) continue;
    if (openNeighbours(next, tile).length > 0) {
      next.turn = other;
      break;
    }
    fall(next, other, last, events, next.out.length);
  }
  next.last = last;
  if (next.turn === null) events.push({ type: "gameOver", winners: result(next)!.winners });
  return { state: next, events };
}

function pick(state: TilesState, seat: Seat, move: TilesMove): MoveOutcome<TilesState, TilesEvent> {
  const next = copy(state);
  next.picks[seat] = move;
  const events: TilesEvent[] = [{ type: "pick", seat }];
  const waiting = movers(next);
  if (waiting.length > 0) {
    next.turn = waiting[0];
    return { state: next, events };
  }
  return playRound(next, events);
}

/**
 * Everyone has picked. Players who picked the same tile bump into each other
 * and stay put, and that tile cracks from the knock. Everyone else steps.
 * Then everyone with nowhere to step falls in at the same time. Every round
 * either moves someone or cracks a tile, so a game can't go on forever.
 */
function playRound(next: TilesState, events: TilesEvent[]): MoveOutcome<TilesState, TilesEvent> {
  const last = emptyLast();
  const byTile = new Map<number, Seat[]>();
  next.picks.forEach((tile, seat) => {
    if (typeof tile === "number") byTile.set(tile, [...(byTile.get(tile) ?? []), seat]);
  });
  for (const [tile, seats] of byTile) {
    if (seats.length === 1) {
      step(next.tiles, next.at, seats[0], tile, last, events);
      continue;
    }
    last.bumps.push({ tile, seats });
    events.push({ type: "bump", tile, seats });
    // Nobody is standing on it, so a tile knocked to its second crack sinks straight away.
    if (next.tiles[tile] === 1) {
      next.tiles[tile] = null;
      last.sank.push(tile);
      events.push({ type: "sink", tile });
    } else {
      next.tiles[tile] = 1;
    }
  }

  const stuck = next.at.flatMap((tile, seat) =>
    tile !== null && openNeighbours(next, tile).length === 0 ? [seat] : [],
  );
  const placed = next.out.length;
  for (const seat of stuck) fall(next, seat, last, events, placed);

  next.last = last;
  next.picks = next.picks.map(() => null);
  next.round++;
  // The game ends with one player left, or with none if the last ones fell in together.
  if (playersLeft(next) <= 1) {
    next.turn = null;
    events.push({ type: "gameOver", winners: result(next)!.winners });
  } else {
    next.turn = next.at.findIndex((tile) => tile !== null);
  }
  return { state: next, events };
}

/** When the time to pick runs out, everyone who hasn't picked steps somewhere at random. */
export function timeOut(state: TilesState, rng: () => number): MoveOutcome<TilesState, TilesEvent> {
  let current = state;
  const events: TilesEvent[] = [];
  for (const seat of movers(state)) {
    const moves = legalMoves(current, seat);
    const outcome = play(current, seat, moves[Math.floor(rng() * moves.length)]);
    current = outcome.state;
    events.push(...outcome.events);
  }
  return { state: { ...current, turns: state.turns + 1 }, events };
}

/** What one seat may see. Picks stay hidden until the round is played. */
export function view(state: TilesState, seat: Seat | null): TilesState {
  if (state.mode === "turns") return state;
  return { ...state, picks: state.picks.map((tile, s) => (s === seat || tile === null ? tile : "hidden")) };
}

/**
 * The last player standing wins. If the last players fall in together, they
 * share the win. Each player scores how many others they outlasted.
 */
export function result(state: TilesState): GameResult | null {
  if (state.turn !== null) return null;
  const standing = state.at.flatMap((tile, seat) => (tile === null ? [] : [seat]));
  const winners = standing.length > 0 ? standing : (state.last?.fell.map((fall) => fall.seat) ?? []);
  const scores = state.placed.map((place, seat) => (winners.includes(seat) ? state.players - 1 : place!));
  return { winners, scores };
}
