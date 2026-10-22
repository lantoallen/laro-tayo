import type { Seat } from "@laro/games";
import {
  LAST_SQUARE,
  jumpFrom,
  nextMove,
  snakesAndLadders,
  type SnakesMove,
  type SnakesState,
} from "@laro/games/snakes-and-ladders";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { FOUR_COLORS, FOUR_SWATCHES } from "@/components/game/settings";
import { Rules } from "./Rules";
import { SnakesBoard } from "./SnakesBoard";

/** Says how the last turn went, once it's over. */
function notice(state: SnakesState, names: readonly string[], you: Seat | null): Notice | null {
  const last = state.last;
  // While someone is moving, the board and the prompt say what's happening.
  if (!last || state.moving) return null;
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

/** What the player whose turn it is has to do now. */
function prompt(state: SnakesState): string {
  const move = nextMove(state);
  if (move === "step") {
    const { left } = state.moving!;
    return `Tap the glowing square to move. ${left === 1 ? "Last step!" : `${left} to go.`}`;
  }
  if (move === "jump") {
    const jump = jumpFrom(state.positions[state.turn!])!;
    return jump.jump === "ladder"
      ? `A ladder! Tap it to climb up to ${jump.to}.`
      : `A snake! Tap it to slide down to ${jump.to}.`;
  }
  return "Roll the die.";
}

/** What to say while someone else is moving. */
function othersTurn(state: SnakesState, name: string): string | null {
  const move = nextMove(state);
  if (move === "step") return `${name} rolled ${state.moving!.roll} and is moving...`;
  if (move === "jump") {
    return jumpFrom(state.positions[state.turn!])!.jump === "ladder"
      ? `${name} found a ladder...`
      : `${name} landed on a snake...`;
  }
  return null;
}

/** The bot pauses before rolling, then hops along at a steady pace. */
function botDelayMs(state: SnakesState): number {
  const move = nextMove(state);
  if (move === "step") return state.moving!.left === state.moving!.roll ? 500 : 250;
  if (move === "jump") return 450;
  // Long enough to see how the last turn ended before the next roll.
  return 900;
}

export const SNAKES_AND_LADDERS: BoardGameConfig<SnakesState, SnakesMove> = {
  game: snakesAndLadders,
  href: "/snakes-and-ladders",
  roomId: "snakes-and-ladders",
  tagline: "Roll the die, move your piece, climb the ladders, and watch out for snakes.",
  colors: FOUR_COLORS,
  swatches: FOUR_SWATCHES,
  botLevels: false,
  Board: SnakesBoard,
  Rules,
  stat: { label: "Square", value: (state, seat) => state.positions[seat] },
  prompt,
  botDelayMs,
  othersTurn,
  notice,
  resultDetail: (state, names) => `${names[state.winner!]} reached square ${LAST_SQUARE} first.`,
  sound: (state) => {
    if (state.lastMove === "step") return "hop";
    if (state.lastMove === "jump") return state.last?.jump === "ladder" ? "climb" : "slide";
    return "roll";
  },
};
