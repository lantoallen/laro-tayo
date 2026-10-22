import type { Seat } from "@laro/games";
import { pig, type PigMove, type PigState } from "@laro/games/pig";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { SEAT_COLORS } from "@/components/game/settings";
import { PigBoard } from "./PigBoard";
import { Rules } from "./Rules";

/** Says when someone rolled a 1 or banked their points. */
function notice(state: PigState, names: readonly [string, string], you: Seat | null): Notice | null {
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

export const PIG: BoardGameConfig<PigState, PigMove> = {
  game: pig,
  href: "/pig",
  roomId: "pig",
  tagline: "Roll for points, but a 1 wipes out your turn. Know when to stop.",
  colors: ["Red", "Blue"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.blue],
  Board: PigBoard,
  Rules,
  stat: { label: "Points", value: (state, seat) => state.scores[seat] },
  prompt: (state) => (state.turnTotal > 0 ? `Roll again, or hold to bank ${state.turnTotal}.` : "Roll the die."),
  botDelayMs: 800,
  notice,
  resultDetail: (state, names) => `Points: ${names[0]} ${state.scores[0]}, ${names[1]} ${state.scores[1]}`,
  sound: (state) => (state.last?.bust ? "miss" : state.last?.action === "hold" ? "match" : "roll"),
};
