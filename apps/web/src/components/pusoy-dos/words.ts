import type { Seat } from "@laro/games";
import { RANKS, SUITS, describe, rankOf, suitOf, type Card, type PusoyEvent } from "@laro/games/pusoy-dos";
import type { Notice } from "@/components/game/parts";

const RANK_PLURALS = ["3s", "4s", "5s", "6s", "7s", "8s", "9s", "10s", "jacks", "queens", "kings", "aces", "2s"];
const FIVE_CARD_NAMES = {
  straight: "a straight",
  flush: "a flush",
  fullHouse: "a full house",
  fourOfAKind: "four of a kind",
  straightFlush: "a straight flush",
} as const;

export const label = (card: Card) => `${RANKS[rankOf(card)]}${SUITS[suitOf(card)]}`;

/** A short name for a play, like "the 7♥", "a pair of 9s", or "a flush". */
export function playName(cards: readonly Card[]): string {
  const combo = describe(cards);
  if (!combo) return "those cards";
  if (combo.kind === "single") return `the ${label(cards[0])}`;
  if (combo.kind === "pair") return `a pair of ${RANK_PLURALS[rankOf(cards[0])]}`;
  if (combo.kind === "triple") return `three ${RANK_PLURALS[rankOf(cards[0])]}`;
  return FIVE_CARD_NAMES[combo.kind];
}

/** A message about the last thing that happened, from the human player's side. */
export function noticeFor(events: readonly PusoyEvent[], names: readonly string[], you: Seat): Notice | null {
  const last = events.at(-1);
  if (!last) return null;
  if (last.type === "roundWon") {
    if (last.seat === you) return { tone: "good", text: "Everyone passed. Start a new round with anything." };
    return { tone: "info", text: `Everyone passed. ${names[last.seat]} starts a new round.` };
  }
  if (last.type === "pass") return { tone: "info", text: last.seat === you ? "You passed" : `${names[last.seat]} passed` };
  if (last.type === "play") {
    const what = playName(last.cards);
    return { tone: "info", text: last.seat === you ? `You played ${what}` : `${names[last.seat]} played ${what}` };
  }
  return null;
}
