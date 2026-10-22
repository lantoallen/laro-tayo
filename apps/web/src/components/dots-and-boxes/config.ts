import type { Seat } from "@laro/games";
import { boxCounts, countBoxes, dotsAndBoxes, type DotsMove, type DotsState } from "@laro/games/dots-and-boxes";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { scoreLine } from "@/components/game/results";
import { FOUR_COLORS, FOUR_SWATCHES } from "@/components/game/settings";
import { DotsBoard } from "./DotsBoard";
import { Rules } from "./Rules";

/** Says when the last line closed a box, since that player goes again. */
function notice(state: DotsState, names: readonly string[], you: Seat | null): Notice | null {
  if (!state.last || state.last.boxes.length === 0) return null;
  const { seat, boxes } = state.last;
  const what = boxes.length === 1 ? "a box" : `${boxes.length} boxes`;
  if (seat === you) return { tone: "good", text: `You closed ${what} and go again` };
  return { tone: you === null ? "good" : "bad", text: `${names[seat]} closed ${what} and goes again` };
}

export const DOTS_AND_BOXES: BoardGameConfig<DotsState, DotsMove> = {
  game: dotsAndBoxes,
  href: "/dots-and-boxes",
  roomId: "dots-and-boxes",
  tagline: "Draw lines between dots. Close a box to claim it and go again.",
  colors: FOUR_COLORS,
  swatches: FOUR_SWATCHES,
  Board: DotsBoard,
  Rules,
  stat: { label: "Boxes", value: (state, seat) => countBoxes(state.boxes, seat) },
  prompt: "Draw a line.",
  notice,
  resultDetail: (state, names) => scoreLine("Boxes", names, boxCounts(state.players, state.boxes)),
  sound: (state) => ((state.last?.boxes.length ?? 0) > 0 ? "match" : "tap"),
};
