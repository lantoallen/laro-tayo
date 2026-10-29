import type { Seat } from "@laro/games";
import { openSteps, sinkingTiles, type TilesMove, type TilesState } from "@laro/games/sinking-tiles";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { listNames } from "@/components/game/results";
import { FOUR_COLORS, FOUR_SWATCHES } from "@/components/game/settings";
import { Rules } from "./Rules";
import { TilesBoard } from "./TilesBoard";

/** Says who fell in on the last move. */
function notice(state: TilesState, names: readonly string[], you: Seat | null): Notice | null {
  const fell = state.last?.fell.map((fall) => fall.seat) ?? [];
  if (fell.length === 0 || state.turn === null) return null;
  if (you !== null && fell.includes(you)) return { tone: "bad", text: "You had nowhere to step and fell in" };
  const who = listNames(fell.map((seat) => names[seat]));
  const tone = you !== null && state.last!.seat === you ? "good" : "info";
  return { tone, text: `${who} had nowhere to step and ${fell.length === 1 ? "fell" : "both fell"} in` };
}

function resultDetail(state: TilesState, names: readonly string[]): string {
  if (state.out.length === 1) return `${names[state.out[0]]} had nowhere left to step.`;
  const [first, ...rest] = state.out.map((seat) => names[seat]);
  return `${first} fell in first, then ${rest.join(", then ")}.`;
}

export const SINKING_TILES: BoardGameConfig<TilesState, TilesMove> = {
  game: sinkingTiles,
  href: "/sinking-tiles",
  roomId: "sinking-tiles",
  tagline: "Every tile takes two steps before it sinks. Be the last one standing.",
  colors: FOUR_COLORS,
  swatches: FOUR_SWATCHES,
  Board: TilesBoard,
  Rules,
  stat: { label: "Ways out", value: (state, seat) => openSteps(state, seat) },
  seatNote: (state, seat) => (state.at[seat] === null ? "fell in" : null),
  prompt: "Tap a glowing tile to step onto it.",
  // Once you're out, the bots finish the game quicker.
  botDelayMs: (state) => (state.at[0] === null ? 350 : 650),
  notice,
  resultDetail,
  sound: (state) => {
    if (state.last?.fell.length) return "sunk";
    return state.last?.sank ? "splash" : "hop";
  },
};
