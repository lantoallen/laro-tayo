import type { Seat } from "@laro/games";
import { pig, type PigMove, type PigState } from "@laro/games/pig";
import type { BoardGameConfig } from "@/components/board-game/types";
import { who } from "@/components/game/MoveSaid";
import type { Notice } from "@/components/game/parts";
import { scoreLine } from "@/components/game/results";
import { FOUR_COLORS, FOUR_SWATCHES } from "@/components/game/settings";
import { PigBoard } from "./PigBoard";
import { Rules } from "./Rules";

/** Says when someone rolled a 1 or banked their points. */
function notice(state: PigState, names: readonly string[], you: Seat | null): Notice | null {
  const last = state.last;
  if (!last) return null;
  const who = names[last.seat];
  const yours = last.seat === you;
  if (last.bust) {
    const lost = last.lost === 1 ? "1 point" : `${last.lost} points`;
    return { tone: yours ? "bad" : you === null ? "info" : "good", text: `${who} rolled a 1 and lost ${lost}` };
  }
  if (last.action === "hold") return { tone: "info", text: `${who} banked ${last.banked} points` };
  return null;
}

/** The last roll or hold in words, like "The bot rolled a 1 and lost 9 points." */
function said(state: PigState, names: readonly string[], you: Seat | null): string | null {
  const last = state.last;
  if (!last) return null;
  const name = who(last.seat, names, you);
  if (last.action === "hold") return `${name} held and banked ${last.banked} ${last.banked === 1 ? "point" : "points"}.`;
  if (last.bust) return `${name} rolled a 1 and lost ${last.lost} ${last.lost === 1 ? "point" : "points"}.`;
  return `${name} rolled a ${last.roll}.`;
}

export const PIG: BoardGameConfig<PigState, PigMove> = {
  game: pig,
  said,
  href: "/pig",
  roomId: "pig",
  tagline: "Roll for points, but a 1 wipes out your turn. Know when to stop.",
  colors: FOUR_COLORS,
  swatches: FOUR_SWATCHES,
  Board: PigBoard,
  Rules,
  stat: { label: "Points", value: (state, seat) => state.scores[seat] },
  prompt: (state) => (state.turnTotal > 0 ? `Roll again, or hold to bank ${state.turnTotal}.` : "Roll the die."),
  botDelayMs: 800,
  notice,
  resultDetail: (state, names) => scoreLine("Points", names, state.scores),
  sound: (state) => (state.last?.bust ? "miss" : state.last?.action === "hold" ? "match" : "roll"),
};
