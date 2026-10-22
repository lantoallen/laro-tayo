import { jakEnPoy, type JakMove, type JakState } from "@laro/games/jak-en-poy";
import type { BoardGameConfig } from "@/components/board-game/types";
import { SEAT_COLORS } from "@/components/game/settings";
import { JakBoard } from "./JakBoard";
import { Rules } from "./Rules";

export const JAK_EN_POY: BoardGameConfig<JakState, JakMove> = {
  game: jakEnPoy,
  href: "/jak-en-poy",
  tagline: "Rock, paper, scissors, the Filipino way. First to win three rounds.",
  colors: ["Red", "Blue"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.blue],
  Board: JakBoard,
  Rules,
  stat: { label: "Rounds won", value: (state, seat) => state.scores[seat] },
  prompt: "Pick rock, paper, or scissors.",
  // The board shows each round's result itself, after the reveal, so there's no message to spoil it.
  resultDetail: (state, names) => `Rounds: ${names[0]} ${state.scores[0]}, ${names[1]} ${state.scores[1]}`,
  // The board plays the round's result once it's revealed. This is just the tap of a pick.
  sound: () => "tap",
};
