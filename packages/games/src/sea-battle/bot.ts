import { pick } from "../engine/rng";
import { IllegalMoveError, type BotOptions, type Seat } from "../engine/types";
import {
  CELLS,
  FLEET,
  SIZE,
  around,
  colOf,
  isSunk,
  otherSeat,
  rowOf,
  shipCells,
  view,
  type SeaMove,
  type SeaState,
} from "./rules";

/** The cells next to a cell, up, down, left, and right. */
function beside(cell: number): number[] {
  const row = rowOf(cell);
  const col = colOf(cell);
  return [
    row > 0 ? cell - SIZE : -1,
    row < SIZE - 1 ? cell + SIZE : -1,
    col > 0 ? cell - 1 : -1,
    col < SIZE - 1 ? cell + 1 : -1,
  ].filter((c) => c !== -1);
}

/**
 * Chooses where to fire. Every level works only from what the player could
 * see: its own shots and the ships it has sunk.
 *
 * - Easy fires at random, and only sometimes follows up a hit.
 * - Medium follows up every hit, and otherwise fires on every other square,
 *   since no ship is shorter than two.
 * - Hard counts every way the ships still afloat could fit around what it knows,
 *   and fires where a ship is most likely to be.
 */
export function chooseMove(state: SeaState, seat: Seat, { level, rng }: BotOptions): SeaMove {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  const seen = view(state, seat);
  const shots = seen.shots[seat];
  const fleet = seen.fleets[otherSeat(seat)];

  const sunk = fleet.filter((ship) => isSunk(ship, shots)).flatMap((ship) => ship!);
  // Ships never touch, so nothing else can be next to a sunk ship.
  const empty = new Set(sunk.flatMap(around));
  const open = shots.flatMap((shot, cell) => (shot === null && !empty.has(cell) ? [cell] : []));
  if (open.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  // Hits on ships that are still afloat.
  const loose = shots.flatMap((shot, cell) => (shot === "hit" && !sunk.includes(cell) ? [cell] : []));
  const followUps = [...new Set(loose.flatMap(beside))].filter((cell) => open.includes(cell));

  if (level === "easy") {
    return followUps.length > 0 && rng() < 0.5 ? pick(rng, followUps) : pick(rng, open);
  }
  if (level === "medium") {
    if (followUps.length > 0) {
      // Two hits side by side give the ship's direction, so keep going along that line.
      const ahead = loose.flatMap((hit) =>
        beside(hit)
          .filter((next) => loose.includes(next))
          .map((next) => hit + (hit - next))
          .filter((cell) => beside(hit).includes(cell) && open.includes(cell)),
      );
      return pick(rng, ahead.length > 0 ? ahead : followUps);
    }
    const checkered = open.filter((cell) => (rowOf(cell) + colOf(cell)) % 2 === 0);
    return pick(rng, checkered.length > 0 ? checkered : open);
  }

  const odds = Array<number>(CELLS).fill(0);
  const afloat = FLEET.filter((_, i) => !isSunk(fleet[i], shots));
  for (const length of afloat) {
    for (let start = 0; start < CELLS; start++) {
      for (const across of [true, false]) {
        const cells = shipCells(start, length, across);
        if (!cells || cells.some((cell) => shots[cell] === "miss" || empty.has(cell) || sunk.includes(cell))) continue;
        const covers = cells.filter((cell) => loose.includes(cell)).length;
        // While a ship is wounded, only count ways it could lie through the hits.
        if (loose.length > 0 && covers === 0) continue;
        for (const cell of cells) odds[cell] += 1 + covers * 20;
      }
    }
  }
  const best = Math.max(...open.map((cell) => odds[cell]));
  return pick(rng, best > 0 ? open.filter((cell) => odds[cell] === best) : open);
}
