import { pick, type Rng } from "../engine/rng";
import { searchBestMoves, WIN, type SearchGame } from "../engine/search";
import { IllegalMoveError, type BotOptions, type Seat } from "../engine/types";
import {
  boardFor,
  legalMoves,
  openNeighbours,
  openSteps,
  play,
  result,
  type TilesMove,
  type TilesState,
} from "./rules";

/**
 * - Easy steps anywhere, but usually not onto a tile it couldn't step off again.
 * - Medium looks one step ahead and picks the step that leaves it the most
 *   room compared with everyone else.
 * - Hard searches several steps ahead, assuming everyone else plays against it.
 *
 * When everyone moves at once, the bots can't see anyone's pick. Medium
 * guesses that everyone else takes the step with the most ways out. Hard
 * guesses that each of them usually plays like medium, and looks two rounds
 * ahead against many such guesses.
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

/** How good a step looks to someone who only counts the ways out from where it lands. */
function waysOutAfter(state: TilesState, seat: Seat, move: TilesMove): number {
  const from = state.at[seat]!;
  return openNeighbours(state, move).filter((next) => next !== from).length;
}

/** The step with the most ways out, which is everyone's first guess at what someone else will pick. */
function carefulPick(state: TilesState, seat: Seat, rng: Rng): TilesMove {
  const moves = openNeighbours(state, state.at[seat]!);
  const best = Math.max(...moves.map((move) => waysOutAfter(state, seat, move)));
  return pick(
    rng,
    moves.filter((move) => waysOutAfter(state, seat, move) === best),
  );
}

/** The round played with these picks for everyone else and `move` for `seat`. */
function afterRound(state: TilesState, seat: Seat, move: TilesMove, others: Map<Seat, TilesMove>): TilesState {
  const picks = state.at.map((tile, s) => (tile === null || s === seat ? null : others.get(s)!));
  return play({ ...state, picks, turn: seat }, seat, move).state;
}

/** The moves that score best on average against a set of guesses at everyone else's picks. */
function bestAgainst(state: TilesState, seat: Seat, moves: TilesMove[], guesses: Map<Seat, TilesMove>[]): TilesMove[] {
  let best = -Infinity;
  let found: TilesMove[] = [];
  for (const move of moves) {
    let total = 0;
    for (const guess of guesses) total += evaluate(afterRound(state, seat, move, guess), seat);
    if (total > best) {
      best = total;
      found = [move];
    } else if (total === best) {
      found.push(move);
    }
  }
  return found;
}

const othersOf = (state: TilesState, seat: Seat) =>
  state.at.flatMap((tile, s) => (tile === null || s === seat ? [] : [s]));

/**
 * Medium, moving at once: the best step if everyone else takes the step with
 * the most ways out. Hard also uses this to guess what others will do, even
 * once they've picked, so it looks at the tiles next to them, not their moves.
 */
function mediumTogether(state: TilesState, seat: Seat, rng: Rng): TilesMove[] {
  const guess = new Map(othersOf(state, seat).map((s) => [s, carefulPick(state, s, rng)]));
  return bestAgainst(state, seat, openNeighbours(state, state.at[seat]!), [guess]);
}

/** Guesses tried by hard for each of its steps. */
const HARD_GUESSES = 36;
/** How often hard guesses that someone else picks what medium would. */
const PLAYS_LIKE_MEDIUM = 0.6;

/** The best `seat` can do next round, if everyone else plays like medium. */
function bestNextRound(state: TilesState, seat: Seat, rng: Rng): number {
  if (state.turn === null || state.at[seat] === null) return evaluate(state, seat);
  const guess = new Map(othersOf(state, seat).map((s) => [s, pick(rng, mediumTogether(state, s, rng))]));
  let best = -Infinity;
  for (const move of openNeighbours(state, state.at[seat]!)) {
    best = Math.max(best, evaluate(afterRound(state, seat, move, guess), seat));
  }
  return best;
}

/**
 * Hard, moving at once: guesses that each other player usually picks what
 * medium would, and otherwise any step at all. For each of its steps it plays
 * the round against many such guesses, then its best step in the round after,
 * and takes the step that does best on average.
 */
function hardTogether(state: TilesState, seat: Seat, moves: TilesMove[], rng: Rng): TilesMove[] {
  const others = othersOf(state, seat);
  const likely = new Map(others.map((s) => [s, mediumTogether(state, s, rng)]));
  const guesses = Array.from(
    { length: HARD_GUESSES },
    () =>
      new Map(
        others.map((s) => {
          const options = rng() < PLAYS_LIKE_MEDIUM ? likely.get(s)! : openNeighbours(state, state.at[s]!);
          return [s, pick(rng, options)];
        }),
      ),
  );
  let best = -Infinity;
  let found: TilesMove[] = [];
  for (const move of moves) {
    let total = 0;
    for (const guess of guesses) total += bestNextRound(afterRound(state, seat, move, guess), seat, rng);
    if (total > best) {
      best = total;
      found = [move];
    } else if (total === best) {
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
  if (state.mode === "together") {
    return pick(rng, level === "medium" ? mediumTogether(state, seat, rng) : hardTogether(state, seat, moves, rng));
  }
  if (level === "medium") return pick(rng, bestByOneStep(state, seat, moves));

  // With more players, deep enough to see its own next step after everyone else has moved.
  const depth = state.players === 2 ? 6 : 5;
  return pick(rng, searchBestMoves(SEARCH, state, seat, { depth, timeLimitMs: 700 }).moves);
}
