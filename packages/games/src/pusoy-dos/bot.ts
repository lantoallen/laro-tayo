import { pick, type Rng } from "../engine/rng";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import { FIVE_CARD_KINDS, describe, rankOf, type Card } from "./cards";
import { movesFor, viewFor, type PusoyMove, type PusoyState, type PusoyView } from "./rules";

const TWO = 12;

/**
 * How much the bot would rather keep these cards. Higher ranks cost more, 2s
 * cost the most, and splitting a pair or triple to play part of it costs extra.
 */
function cost(cards: readonly Card[], hand: readonly Card[]): number {
  let total = 0;
  for (const card of cards) total += rankOf(card) === TWO ? 20 : rankOf(card);
  const ranksPlayed = new Set(cards.map(rankOf));
  for (const rank of ranksPlayed) {
    const held = hand.filter((card) => rankOf(card) === rank).length;
    const used = cards.filter((card) => rankOf(card) === rank).length;
    if (used < held && cards.length < 5) total += 4;
  }
  return total / cards.length;
}

const cheapest = (moves: PusoyMove[], hand: readonly Card[]) =>
  [...moves].sort((a, b) => cost(a, hand) - cost(b, hand))[0];

/** The strongest play by its own kind and key, used to keep control when someone is about to win. */
function strongest(moves: PusoyMove[]): PusoyMove {
  const rank = (cards: PusoyMove) => {
    const combo = describe(cards)!;
    const kind = FIVE_CARD_KINDS.indexOf(combo.kind as never);
    return kind * 10_000 + combo.key;
  };
  return [...moves].sort((a, b) => rank(b) - rank(a))[0];
}

/** Picks what to lead with: shed the most cards cheaply, keeping 2s for later. */
function lead(view: PusoyView, plays: PusoyMove[], hand: Card[], level: BotLevel): PusoyMove {
  const nearlyOut = view.counts.some((count, seat) => seat !== view.turn && count === 1);
  // Don't hand someone with one card left an easy single, unless there's nothing else.
  const guard = level === "hard" && nearlyOut;
  for (const size of [5, 3, 2, 1]) {
    if (size === 1 && guard && plays.some((cards) => cards.length > 1)) continue;
    const options = plays.filter(
      (cards) => cards.length === size && (size === 5 || !cards.some((card) => rankOf(card) === TWO)),
    );
    if (options.length === 0) continue;
    return size === 1 && guard ? strongest(options) : cheapest(options, hand);
  }
  return guard ? strongest(plays) : cheapest(plays, hand);
}

/** Picks a play from what this seat can see. */
function decide(view: PusoyView, seat: Seat, level: BotLevel, rng: Rng): PusoyMove {
  const moves = movesFor(view, seat);
  if (moves.length === 0 || !view.hand) throw new IllegalMoveError(`Seat ${seat} has no moves`);
  const hand = view.hand;
  const plays = moves.filter((move) => move.length > 0);
  const canPass = plays.length < moves.length;

  if (level === "easy") {
    if (canPass && rng() < 0.3) return [];
    return pick(rng, plays.length > 0 ? plays : moves);
  }
  if (level === "medium" && rng() < 0.1) return pick(rng, moves);

  if (!view.table) return lead(view, plays, hand, level);
  if (plays.length === 0) return [];

  const lowestOpponent = Math.min(...view.counts.filter((_, other) => other !== seat));
  // Someone is about to win: take control with the strongest play.
  if (level === "hard" && lowestOpponent <= 2) return strongest(plays);

  const choice = cheapest(plays, hand);
  const spendsATwo = choice.some((card) => rankOf(card) === TWO);
  // Save 2s for later unless the game is close to ending.
  if (canPass && spendsATwo && hand.length > 5 && lowestOpponent > 3) return [];
  return choice;
}

export function chooseMove(state: PusoyState, seat: Seat, { level, rng }: BotOptions): PusoyMove {
  return decide(viewFor(state, seat), seat, level, rng);
}

/** The same choice from a view, for screens and servers that only hold what one seat can see. */
export function chooseMoveFromView(view: PusoyView, seat: Seat, { level, rng }: BotOptions): PusoyMove {
  return decide(view, seat, level, rng);
}
