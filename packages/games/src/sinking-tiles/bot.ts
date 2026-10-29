import { pick } from "../engine/rng";
import { searchBestMoves, WIN, type SearchGame } from "../engine/search";
import { IllegalMoveError, type BotOptions, type Seat } from "../engine/types";
import { boardFor, legalMoves, openNeighbours, openSteps, play, result, type TilesMove, type TilesState } from "./rules";

/**
 * - Easy steps anywhere, but usually not onto a tile it couldn't step off again.
 * - Medium looks one step ahead and picks the step that leaves it the most
 *   room compared with everyone else.
 * - Hard searches several steps ahead, assuming everyone else plays against it.
 */

/**
 * How much room each seat has: the steps left in the tiles it can reach
 * before anyone else can. A whole tile has two steps left in it, a cracked one has one.
 */
export function room(state: TilesState): number[] {
  const { neighbours } = boardFor(state.radius);
  const owner: (Seat | -1 | null)[] = state.tiles.map(() => null);
  const area = state.at.map(() => 0);
  let frontier: { tile: number; seat: Seat }[] = [];
  state.at.forEach((tile, seat) => {
    if (tile === null) return;
    owner[tile] = seat;
    frontier.push({ tile, seat });
  });

  while (frontier.length > 0) {
    const reached = new Map<number, Seat | -1>();
    for (const { tile, seat } of frontier) {
      for (const next of neighbours[tile]) {
        if (state.tiles[next] === null || owner[next] !== null) continue;
        // Reached by two players at once: it belongs to neither.
        const other = reached.get(next);
        reached.set(next, other === undefined || other === seat ? seat : -1);
      }
    }
    frontier = [];
    for (const [tile, seat] of reached) {
      owner[tile] = seat;
      if (seat === -1) continue;
      area[seat] += 2 - state.tiles[tile]!;
      frontier.push({ tile, seat });
    }
  }
  return area;
}

/** Room, then how many ways out there are next turn. */
function evaluate(state: TilesState, me: Seat): number {
  const outcome = result(state);
  if (outcome) return outcome.winners.includes(me) ? WIN : -WIN;
  if (state.at[me] === null) return -WIN;
  const areas = room(state);
  let best = -Infinity;
  for (let seat = 0; seat < state.players; seat++) {
    if (seat !== me && state.at[seat] !== null) best = Math.max(best, areas[seat] + openSteps(state, seat));
  }
  return 10 * (areas[me] - best) + 3 * openSteps(state, me) - 3 * (state.players - 1 - state.out.length);
}

const SEARCH: SearchGame<TilesState, TilesMove> = {
  turn: (state) => state.turn,
  children: (state, seat) => legalMoves(state, seat).map((move) => ({ move, state: play(state, seat, move).state })),
  evaluate,
};

/** Each move with how good it looks from one step ahead. */
function bestByOneStep(state: TilesState, seat: Seat, moves: TilesMove[]): TilesMove[] {
  let best = -Infinity;
  let found: TilesMove[] = [];
  for (const move of moves) {
    const score = evaluate(play(state, seat, move).state, seat);
    if (score > best) {
      best = score;
      found = [move];
    } else if (score === best) {
      found.push(move);
    }
  }
  return found;
}

export function chooseMove(state: TilesState, seat: Seat, { level, rng }: BotOptions): TilesMove {
  const moves = legalMoves(state, seat);
  if (moves.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);

  if (level === "easy") {
    // Tiles it could step off again, not counting where it's standing now.
    const from = state.at[seat]!;
    const ways = moves.filter((move) => openNeighbours(state, move).some((next) => next !== from));
    return pick(rng, ways.length > 0 && rng() < 0.8 ? ways : moves);
  }
  if (level === "medium") return pick(rng, bestByOneStep(state, seat, moves));

  // With more players, deep enough to see its own next step after everyone else has moved.
  const depth = state.players === 2 ? 6 : 5;
  return pick(rng, searchBestMoves(SEARCH, state, seat, { depth, timeLimitMs: 700 }).moves);
}
