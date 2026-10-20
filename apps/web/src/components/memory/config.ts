import type { Seat } from "@laro/games";
import { countPairs, memory, type MemoryMove, type MemoryState } from "@laro/games/memory";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { MemoryBoard } from "./MemoryBoard";
import { Rules } from "./Rules";

/** Says how the last turn went: a pair found, or a miss. */
function notice(state: MemoryState, names: readonly [string, string], you: Seat | null): Notice | null {
  if (!state.last) return null;
  const { seat, matched } = state.last;
  if (matched) {
    if (seat === you) return { tone: "good", text: "You found a pair and go again" };
    return { tone: you === null ? "good" : "bad", text: `${names[seat]} found a pair and goes again` };
  }
  return { tone: "info", text: seat === you ? "No match this time" : `${names[seat]} didn't find a match` };
}

export const MEMORY: BoardGameConfig<MemoryState, MemoryMove> = {
  game: memory,
  href: "/memory",
  roomId: "memory",
  tagline: "Turn over two cards at a time and find the pairs.",
  colors: ["Red", "Blue"],
  Board: MemoryBoard,
  Rules,
  stat: { label: "Pairs", value: (state, seat) => countPairs(state.owner, seat) },
  prompt: (state) => (state.flipped.length === 1 ? "Turn over another card." : "Turn over a card."),
  // Slower than other games, so there's time to see the bot's cards and your own misses.
  botDelayMs: 1100,
  notice,
  resultDetail: (state, names) =>
    `Pairs: ${names[0]} ${countPairs(state.owner, 0)}, ${names[1]} ${countPairs(state.owner, 1)}`,
};
