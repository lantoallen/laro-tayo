/**
 * Cards are numbers from 0 to 51: rank × 4 + suit. Ranks run 3, 4, … K, A, 2
 * (0 to 12) and suits run clubs, spades, hearts, diamonds (0 to 3), so a bigger
 * number is always a stronger single card. The 3 of clubs is 0 and the 2 of diamonds is 51.
 */
export type Card = number;

export const RANKS = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"] as const;
export const SUITS = ["♣", "♠", "♥", "♦"] as const;
export const SUIT_NAMES = ["clubs", "spades", "hearts", "diamonds"] as const;
export const RANK_NAMES = ["3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace", "2"] as const;

export const THREE_OF_CLUBS: Card = 0;
const ACE = 11;

export const rankOf = (card: Card) => Math.floor(card / 4);
export const suitOf = (card: Card) => card % 4;
export const cardOf = (rank: number, suit: number): Card => rank * 4 + suit;

export function cardLabel(card: Card): string {
  return `${RANKS[rankOf(card)]}${SUITS[suitOf(card)]}`;
}

export function cardName(card: Card): string {
  return `${RANK_NAMES[rankOf(card)]} of ${SUIT_NAMES[suitOf(card)]}`;
}

/** Five-card hands from weakest to strongest. A stronger kind always beats a weaker one. */
export const FIVE_CARD_KINDS = ["straight", "flush", "fullHouse", "fourOfAKind", "straightFlush"] as const;

export type ComboKind = "single" | "pair" | "triple" | (typeof FIVE_CARD_KINDS)[number];

export interface Combo {
  kind: ComboKind;
  /** Compares two combos of the same kind. Higher wins. */
  key: number;
}

export const COMBO_NAMES: Record<ComboKind, string> = {
  single: "a single",
  pair: "a pair",
  triple: "three of a kind",
  straight: "a straight",
  flush: "a flush",
  fullHouse: "a full house",
  fourOfAKind: "four of a kind",
  straightFlush: "a straight flush",
};

/** What a set of cards makes, or null if it isn't something you can play. */
export function describe(cards: readonly Card[]): Combo | null {
  if (new Set(cards).size !== cards.length) return null;
  const sorted = [...cards].sort((a, b) => a - b);
  const high = sorted[sorted.length - 1];
  const ranks = sorted.map(rankOf);
  const sameRank = ranks.every((rank) => rank === ranks[0]);

  if (sorted.length === 1) return { kind: "single", key: high };
  if (sorted.length === 2) return sameRank ? { kind: "pair", key: high } : null;
  if (sorted.length === 3) return sameRank ? { kind: "triple", key: ranks[0] } : null;
  if (sorted.length !== 5) return null;

  const flush = sorted.every((card) => suitOf(card) === suitOf(sorted[0]));
  // A 2 can't be part of a straight in this version, so the highest straight ends on an ace.
  const straight = ranks.every((rank, i) => i === 0 || rank === ranks[i - 1] + 1) && ranks[4] <= ACE;
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const rankWithCount = (n: number) => [...counts].find(([, count]) => count === n)?.[0];

  if (straight && flush) return { kind: "straightFlush", key: high };
  if (counts.size === 2 && rankWithCount(4) !== undefined) return { kind: "fourOfAKind", key: rankWithCount(4)! };
  if (counts.size === 2 && rankWithCount(3) !== undefined) return { kind: "fullHouse", key: rankWithCount(3)! };
  // Flushes are compared by suit first, then by their highest card.
  if (flush) return { kind: "flush", key: suitOf(high) * 64 + high };
  if (straight) return { kind: "straight", key: high };
  return null;
}

/** The number of cards a combo uses. */
export function sizeOf(kind: ComboKind): number {
  if (kind === "single") return 1;
  if (kind === "pair") return 2;
  if (kind === "triple") return 3;
  return 5;
}

/** Whether `play` beats `table`. It has to use the same number of cards. */
export function beats(play: Combo, table: Combo): boolean {
  if (sizeOf(play.kind) !== sizeOf(table.kind)) return false;
  if (sizeOf(play.kind) === 5 && play.kind !== table.kind) {
    return FIVE_CARD_KINDS.indexOf(play.kind as never) > FIVE_CARD_KINDS.indexOf(table.kind as never);
  }
  return play.key > table.key;
}

/** Every playable combo in a hand, as sorted lists of cards. */
export function combosIn(hand: readonly Card[]): Card[][] {
  const cards = [...hand].sort((a, b) => a - b);
  const combos: Card[][] = cards.map((card) => [card]);
  const choose = (size: number, start: number, picked: Card[]) => {
    if (picked.length === size) {
      if (describe(picked)) combos.push([...picked]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      // Pairs and triples need matching ranks, so stop early once ranks differ.
      if (size < 5 && picked.length > 0 && rankOf(cards[i]) !== rankOf(picked[0])) break;
      picked.push(cards[i]);
      choose(size, i + 1, picked);
      picked.pop();
    }
  };
  for (const size of [2, 3, 5]) choose(size, 0, []);
  return combos;
}

/** A shuffled 52-card deck. */
export function shuffledDeck(rng: () => number): Card[] {
  const deck = Array.from({ length: 52 }, (_, card) => card);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
