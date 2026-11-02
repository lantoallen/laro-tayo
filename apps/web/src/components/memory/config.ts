import type { Seat } from "@laro/games";
import { countPairs, memory, pairCounts, type MemoryMove, type MemoryState } from "@laro/games/memory";
import type { BoardGameConfig } from "@/components/board-game/types";
import { who } from "@/components/game/MoveSaid";
import type { Notice } from "@/components/game/parts";
import { scoreLine } from "@/components/game/results";
import { FOUR_COLORS, FOUR_SWATCHES } from "@/components/game/settings";
import { MemoryBoard, faceName } from "./MemoryBoard";
import { Rules } from "./Rules";

/** Says how the last turn went: a pair found, or a miss. The turn badge says who's next. */
function notice(state: MemoryState, names: readonly string[], you: Seat | null): Notice | null {
  if (!state.last) return null;
  const { seat, matched } = state.last;
  if (matched) {
    if (seat === you) return { tone: "good", text: "You found a pair!" };
    return { tone: you === null ? "good" : "bad", text: `${names[seat]} found a pair` };
  }
  return { tone: "info", text: seat === you ? "No match this time" : `${names[seat]} didn't find a match` };
}

/** The card just turned over in words, like "The bot turned over card 7, a red star. No match." */
function said(state: MemoryState, names: readonly string[], you: Seat | null): string | null {
  const turned = (card: number) => {
    const face = state.faces[card];
    return face >= 0 ? `card ${card + 1}, ${faceName(face)}` : `card ${card + 1}`;
  };
  if (state.last) {
    const { seat, cards, matched } = state.last;
    return `${who(seat, names, you)} turned over ${turned(cards[1])}. ${matched ? "A pair!" : "No match."}`;
  }
  if (state.flipped.length === 1 && state.turn !== null) {
    return `${who(state.turn, names, you)} turned over ${turned(state.flipped[0])}.`;
  }
  return null;
}

export const MEMORY: BoardGameConfig<MemoryState, MemoryMove> = {
  game: memory,
  said,
  href: "/memory",
  roomId: "memory",
  tagline: "Turn over two cards at a time and find the pairs.",
  colors: FOUR_COLORS,
  swatches: FOUR_SWATCHES,
  Board: MemoryBoard,
  Rules,
  stat: { label: "Pairs", value: (state, seat) => countPairs(state.owner, seat) },
  prompt: (state) => (state.flipped.length === 1 ? "Turn over another card." : "Turn over a card."),
  // Slower than other games, so there's time to see the bot's cards and your own misses.
  botDelayMs: 1100,
  notice,
  resultDetail: (state, names) => scoreLine("Pairs", names, pairCounts(state)),
  sound: (state) => (state.flipped.length === 1 ? "flip" : state.last?.matched ? "match" : "miss"),
};
