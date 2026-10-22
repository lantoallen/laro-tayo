import type { Seat } from "@laro/games";
import { LAST_SQUARE, snakesAndLadders, type SnakesMove, type SnakesState } from "@laro/games/snakes-and-ladders";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { SEAT_COLORS } from "@/components/game/settings";
import { Rules } from "./Rules";
import { SnakesBoard } from "./SnakesBoard";

/** Says what the last roll did. */
function notice(state: SnakesState, names: readonly [string, string], you: Seat | null): Notice | null {
  const last = state.last;
  if (!last) return null;
  const who = names[last.seat];
  const yours = last.seat === you;
  if (last.jump === "ladder") {
    return {
      tone: yours || you === null ? "good" : "bad",
      text: `${who} rolled ${last.roll} and climbed a ladder to ${last.to}`,
    };
  }
  if (last.jump === "snake") {
    return {
      tone: yours ? "bad" : you === null ? "info" : "good",
      text: `${who} rolled ${last.roll} and slid down to ${last.to}`,
    };
  }
  if (last.landed === last.from && last.from + last.roll > LAST_SQUARE) {
    return { tone: "info", text: `${who} rolled ${last.roll}, but needs exactly ${LAST_SQUARE - last.from}` };
  }
  return { tone: "info", text: `${who} rolled ${last.roll}` };
}

export const SNAKES_AND_LADDERS: BoardGameConfig<SnakesState, SnakesMove> = {
  game: snakesAndLadders,
  href: "/snakes-and-ladders",
  roomId: "snakes-and-ladders",
  tagline: "Roll the die, climb the ladders, and watch out for snakes.",
  colors: ["Red", "Blue"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.blue],
  botLevels: false,
  Board: SnakesBoard,
  Rules,
  stat: { label: "Square", value: (state, seat) => state.positions[seat] },
  prompt: "Roll the die.",
  // Long enough to watch the bot's piece walk, climb, or slide.
  botDelayMs: 1200,
  notice,
  resultDetail: (state, names) => `${names[state.winner!]} reached square ${LAST_SQUARE} first.`,
  sound: () => "roll",
};
