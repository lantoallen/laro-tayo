import type { Seat } from "@laro/games";
import { SHIP_NAMES, otherSeat, seaBattle, shipsLeft, type SeaMove, type SeaState } from "@laro/games/sea-battle";
import type { BoardGameConfig } from "@/components/board-game/types";
import { SEAT_COLORS } from "@/components/game/settings";
import type { Notice } from "@/components/game/parts";
import { SeaBoard } from "./SeaBoard";
import { Rules } from "./Rules";

/** Says what the last shot did: a miss, a hit, or a ship sunk. */
function notice(state: SeaState, names: readonly [string, string], you: Seat | null): Notice | null {
  const last = state.last;
  if (!last) return null;
  const victim = otherSeat(last.seat);
  const sunkName = last.sunk === null ? null : SHIP_NAMES[last.sunk];
  if (last.seat === you) {
    if (sunkName) return { tone: "good", text: `You sank their ${sunkName}` };
    return last.hit ? { tone: "good", text: "Hit!" } : { tone: "info", text: "Miss" };
  }
  const shooter = names[last.seat];
  if (!last.hit) return { tone: "info", text: `${shooter} missed` };
  if (you === victim) {
    const ship = state.fleets[victim].findIndex((cells) => cells?.includes(last.cell));
    if (sunkName) return { tone: "bad", text: `${shooter} sank your ${sunkName}` };
    return { tone: "bad", text: `${shooter} hit your ${SHIP_NAMES[ship]}` };
  }
  return { tone: "good", text: sunkName ? `${shooter} sank a ${sunkName}` : `${shooter} hit a ship` };
}

export const SEA_BATTLE: BoardGameConfig<SeaState, SeaMove> = {
  game: seaBattle,
  href: "/sea-battle",
  roomId: "sea-battle",
  tagline: "Find the other side's hidden ships and sink them all first.",
  colors: ["Red", "Blue"],
  swatches: [SEAT_COLORS.red, SEAT_COLORS.blue],
  passAndPlay: false,
  Board: SeaBoard,
  Rules,
  stat: { label: "Ships left", value: shipsLeft },
  prompt: "Pick a square in their waters.",
  notice,
  resultDetail: (state, names) => `Ships left: ${names[0]} ${shipsLeft(state, 0)}, ${names[1]} ${shipsLeft(state, 1)}`,
  sound: (state) => (state.last?.sunk != null ? "sunk" : state.last?.hit ? "hit" : "splash"),
};
