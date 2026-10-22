import { pick } from "../engine/rng";
import { IllegalMoveError, type BotOptions, type Seat } from "../engine/types";
import { BOXES, BOX_LINES, LINES, LINE_BOXES, type DotsMove, type DotsState } from "./rules";

/**
 * The bots don't search ahead like the board game bots. Dots and Boxes is
 * played by a few well-known rules instead:
 *
 * - Easy takes boxes when it sees them, but otherwise often draws any line.
 * - Medium also never draws a box's third side while it has a choice, and
 *   when it has to, it gives away as few boxes as it can.
 * - Hard does all that, plays the last few safe lines so the other player
 *   has to open the first chain, and once only chains are left it works out
 *   which one to give away and when to hand back the last two boxes of a
 *   chain to keep control of the game. That counting assumes one opponent, so
 *   with more players hard plays like medium.
 */

type Drawn = readonly boolean[];

function sides(drawn: Drawn, box: number): number {
  let count = 0;
  for (const line of BOX_LINES[box]) if (drawn[line]) count++;
  return count;
}

function undrawnLines(drawn: Drawn, box: number): number[] {
  return BOX_LINES[box].filter((line) => !drawn[line]);
}

/** Lines that close a box right now. */
function closingLines(drawn: Drawn): number[] {
  const lines = new Set<number>();
  for (let box = 0; box < BOXES; box++) {
    if (sides(drawn, box) === 3) lines.add(undrawnLines(drawn, box)[0]);
  }
  return [...lines];
}

/** Lines that don't draw the third side of any box. */
function safeLines(drawn: Drawn): number[] {
  const lines: number[] = [];
  for (let line = 0; line < LINES; line++) {
    if (!drawn[line] && LINE_BOXES[line].every((box) => sides(drawn, box) <= 1)) lines.push(line);
  }
  return lines;
}

/** How many boxes the other player gets after `line` if they take every box they can. */
function giveaway(drawn: Drawn, line: number): number {
  const next = [...drawn];
  next[line] = true;
  let taken = 0;
  for (let progress = true; progress;) {
    progress = false;
    for (let box = 0; box < BOXES; box++) {
      if (sides(next, box) !== 3) continue;
      const closing = undrawnLines(next, box)[0];
      next[closing] = true;
      taken += LINE_BOXES[closing].filter((b) => sides(next, b) === 4).length;
      progress = true;
    }
  }
  return taken;
}

/** The lines that give away the fewest boxes. */
function cheapestLines(drawn: Drawn): number[] {
  let best = Infinity;
  let lines: number[] = [];
  for (let line = 0; line < LINES; line++) {
    if (drawn[line]) continue;
    const cost = giveaway(drawn, line);
    if (cost < best) {
      best = cost;
      lines = [line];
    } else if (cost === best) {
      lines.push(line);
    }
  }
  return lines;
}

/** A run of open boxes joined by undrawn lines. A chain has two open ends on the edge of the board; a loop has none. */
interface Component {
  boxes: number[];
  loop: boolean;
}

/**
 * Splits the open boxes into chains and loops. Returns null unless every open
 * box has exactly two sides drawn, because only then is the simple count below exact.
 */
function components(drawn: Drawn): Component[] | null {
  const open: number[] = [];
  for (let box = 0; box < BOXES; box++) {
    const count = sides(drawn, box);
    if (count === 4) continue;
    if (count !== 2) return null;
    open.push(box);
  }
  const seen = new Set<number>();
  const found: Component[] = [];
  for (const start of open) {
    if (seen.has(start)) continue;
    const boxes: number[] = [];
    let edges = 0;
    const stack = [start];
    seen.add(start);
    while (stack.length > 0) {
      const box = stack.pop()!;
      boxes.push(box);
      for (const line of undrawnLines(drawn, box)) {
        const other = LINE_BOXES[line].find((b) => b !== box);
        if (other === undefined) edges++;
        else if (!seen.has(other)) {
          seen.add(other);
          stack.push(other);
        }
      }
    }
    found.push({ boxes, loop: edges === 0 });
  }
  return found;
}

/** A list without the item at `index`. */
function without<T>(list: readonly T[], index: number): T[] {
  return [...list.slice(0, index), ...list.slice(index + 1)];
}

/**
 * What opening a chain or loop is worth to the player who opens it, when the
 * chains and loops after it are worth `rest` to whoever has to open next.
 * The other player can take every box, or take all but 2 and hand those back
 * so the opener has to open the next one too (all but 4 for a loop). That
 * isn't possible with a chain of 1 or 2.
 */
function openingScore(size: number, loop: boolean, rest: number): number {
  const takeAll = size + rest;
  const handBack = loop ? size - 8 - rest : size >= 3 ? size - 4 - rest : -Infinity;
  return -Math.max(takeAll, handBack);
}

const values = new Map<string, number>();

/** The best score difference for the player who has to open one of these chains or loops. */
function value(chains: readonly number[], loops: readonly number[]): number {
  if (chains.length === 0 && loops.length === 0) return 0;
  const key = `${[...chains].sort((a, b) => a - b)}|${[...loops].sort((a, b) => a - b)}`;
  const known = values.get(key);
  if (known !== undefined) return known;

  let best = -Infinity;
  chains.forEach((size, i) => {
    best = Math.max(best, openingScore(size, false, value(without(chains, i), loops)));
  });
  loops.forEach((size, i) => {
    best = Math.max(best, openingScore(size, true, value(chains, without(loops, i))));
  });
  values.set(key, best);
  return best;
}

const sizes = (found: Component[], loop: boolean) => found.filter((c) => c.loop === loop).map((c) => c.boxes.length);

/**
 * With only chains and loops left, picks the one to open and where. A chain of
 * two is opened in the middle, so the other player can't hand it back.
 */
function openingLine(drawn: Drawn, found: Component[]): number {
  let best = -Infinity;
  let choice = found[0];
  found.forEach((component, i) => {
    const rest = without(found, i);
    const size = component.boxes.length;
    const score = openingScore(size, component.loop, value(sizes(rest, false), sizes(rest, true)));
    if (score > best || (score === best && size < choice.boxes.length)) {
      best = score;
      choice = component;
    }
  });

  const inside = choice.boxes.flatMap((box) =>
    undrawnLines(drawn, box).filter((line) => LINE_BOXES[line].length === 2),
  );
  if (!choice.loop && choice.boxes.length === 2) return inside[0];
  if (choice.loop) return inside[0];
  // Open a chain at one of its ends, on the edge of the board.
  return choice.boxes.flatMap((box) => undrawnLines(drawn, box)).find((line) => LINE_BOXES[line].length === 1)!;
}

/**
 * When the last two boxes of a chain are all that's left to take, and taking
 * them would mean opening the next chain, it can be better to draw the far
 * end instead: the other player gets those two boxes but has to open the next chain.
 */
function handBackLine(drawn: Drawn, closing: number[]): number | null {
  if (closing.length !== 1) return null;
  const [line] = closing;
  const pair = LINE_BOXES[line];
  if (pair.length !== 2) return null;
  const next = pair.find((box) => sides(drawn, box) === 2);
  if (next === undefined) return null;
  const far = undrawnLines(drawn, next).find((l) => l !== line);
  if (far === undefined || LINE_BOXES[far].length !== 1) return null;

  const after = [...drawn];
  after[line] = true;
  after[far] = true;
  if (closingLines(after).length > 0 || safeLines(after).length > 0) return null;
  const found = components(after);
  if (found === null) return null;
  const rest = value(sizes(found, false), sizes(found, true));
  // Taking both: 2 boxes, then open the next chain. Handing back: they get 2 and open it.
  return -2 - rest > 2 + rest ? far : null;
}

/** Search the end of the safe lines exactly once there are this few left. */
const SAFE_SEARCH_LIMIT = 10;

/**
 * Who has to open the first chain decides most games. With only a few safe
 * lines left, this tries every order they could be drawn in and scores where
 * each one ends up, from the side of the player about to draw.
 */
function safeEndingScore(drawn: Drawn, memo: Map<string, number>): number {
  const safe = safeLines(drawn);
  if (safe.length === 0) {
    const found = components(drawn);
    if (found !== null) return value(sizes(found, false), sizes(found, true));
    // Some boxes still have three open sides, so just count what the cheapest line gives away.
    return -Math.min(...cheapestLines(drawn).map((line) => giveaway(drawn, line)));
  }
  const key = drawn.map((line) => (line ? "1" : "0")).join("");
  const known = memo.get(key);
  if (known !== undefined) return known;
  let best = -Infinity;
  for (const line of safe) {
    const next = [...drawn];
    next[line] = true;
    best = Math.max(best, -safeEndingScore(next, memo));
  }
  memo.set(key, best);
  return best;
}

/** The safe lines that leave the other player opening the first chain, when that can be worked out. */
function bestSafeLines(drawn: Drawn, safe: number[]): number[] {
  if (safe.length > SAFE_SEARCH_LIMIT) return safe;
  const memo = new Map<string, number>();
  let best = -Infinity;
  let lines: number[] = [];
  for (const line of safe) {
    const next = [...drawn];
    next[line] = true;
    const score = -safeEndingScore(next, memo);
    if (score > best) {
      best = score;
      lines = [line];
    } else if (score === best) {
      lines.push(line);
    }
  }
  return lines;
}

/** Lines that close a box without drawing the third side of the next one, so chains get eaten last. */
function lastToEat(drawn: Drawn, closing: number[]): number[] {
  const loose = closing.filter((line) => {
    const after = [...drawn];
    after[line] = true;
    return LINE_BOXES[line].every((box) => sides(after, box) === 4 || sides(after, box) <= 2);
  });
  return loose.length > 0 ? loose : closing;
}

export function chooseMove(state: DotsState, seat: Seat, { level, rng }: BotOptions): DotsMove {
  if (state.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  const drawn = state.lines.map((line) => line !== null);
  const legal = drawn.flatMap((isDrawn, line) => (isDrawn ? [] : [line]));
  if (legal.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);

  const closing = closingLines(drawn);
  const safe = safeLines(drawn);

  if (level === "easy") {
    if (rng() < 0.25) return pick(rng, legal);
    if (closing.length > 0) return pick(rng, closing);
    return safe.length > 0 && rng() < 0.6 ? pick(rng, safe) : pick(rng, legal);
  }

  // Counting chains to keep control only works against one other player.
  const plotting = level === "hard" && state.players === 2;
  if (closing.length > 0) {
    if (plotting) return handBackLine(drawn, closing) ?? pick(rng, lastToEat(drawn, closing));
    return pick(rng, closing);
  }
  if (safe.length > 0) return pick(rng, plotting ? bestSafeLines(drawn, safe) : safe);
  if (plotting) {
    const found = components(drawn);
    if (found !== null) return openingLine(drawn, found);
  }
  return pick(rng, cheapestLines(drawn));
}
