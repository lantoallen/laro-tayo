import type { Seat } from "@laro/games";
import {
  openSteps,
  sinkingTiles,
  sinkingTilesTogether,
  type TilesMove,
  type TilesState,
} from "@laro/games/sinking-tiles";
import type { BoardGameConfig } from "@/components/board-game/types";
import type { Notice } from "@/components/game/parts";
import { listNames } from "@/components/game/results";
import { FOUR_COLORS, FOUR_SWATCHES } from "@/components/game/settings";
import { Rules } from "./Rules";
import { TilesBoard } from "./TilesBoard";

/** Says who fell in, or who bumped into whom, on the last move or round. */
function notice(state: TilesState, names: readonly string[], you: Seat | null): Notice | null {
  const last = state.last;
  if (!last || state.turn === null) return null;
  // While a round is being picked, the last round's news is old.
  if (state.picks.some((pick) => pick !== null)) return null;

  const fell = last.fell.map((fall) => fall.seat);
  if (fell.length > 0) {
    if (you !== null && fell.includes(you)) return { tone: "bad", text: "You had nowhere to step and fell in" };
    const tone = you !== null && last.steps[0]?.seat === you && state.mode === "turns" ? "good" : "info";
    const who = listNames(fell.map((seat) => names[seat]));
    return { tone, text: `${who} had nowhere to step and ${fell.length === 1 ? "fell" : "all fell"} in` };
  }

  const bump = last.bumps.find(({ seats }) => you !== null && seats.includes(you)) ?? last.bumps[0];
  if (!bump) return null;
  if (you !== null && bump.seats.includes(you)) {
    const others = listNames(bump.seats.filter((seat) => seat !== you).map((seat) => names[seat]));
    return { tone: "bad", text: `You bumped into ${others} and stayed put` };
  }
  return { tone: "info", text: `${listNames(bump.seats.map((seat) => names[seat]))} bumped into each other` };
}

function resultDetail(state: TilesState, names: readonly string[]): string {
  const winners = state.at.some((tile) => tile !== null) ? [] : (state.last?.fell.map((fall) => fall.seat) ?? []);
  if (winners.length > 1) return `${listNames(winners.map((seat) => names[seat]))} fell in at the same time.`;
  if (state.out.length === 1) return `${names[state.out[0]]} had nowhere left to step.`;
  const [first, ...rest] = state.out.map((seat) => names[seat]);
  return `${first} fell in first, then ${rest.join(", then ")}.`;
}

const SHARED = {
  href: "/sinking-tiles",
  colors: FOUR_COLORS,
  swatches: FOUR_SWATCHES,
  Board: TilesBoard,
  Rules,
  stat: { label: "Ways out", value: (state: TilesState, seat: Seat) => openSteps(state, seat) },
  notice,
  resultDetail,
} satisfies Partial<BoardGameConfig<TilesState, TilesMove>>;

/** Players take turns stepping. */
export const SINKING_TILES: BoardGameConfig<TilesState, TilesMove> = {
  ...SHARED,
  game: sinkingTiles,
  roomId: "sinking-tiles",
  tagline: "Every tile takes two steps before it sinks. Be the last one standing.",
  seatNote: (state, seat) => (state.at[seat] === null ? "fell in" : null),
  prompt: "Tap a glowing tile to step onto it.",
  // Once you're out, the bots finish the game quicker.
  botDelayMs: (state) => (state.at[0] === null ? 350 : 650),
  sound: (state) => {
    if (state.last?.fell.length) return "sunk";
    return state.last?.sank.length ? "splash" : "hop";
  },
};

/** Everyone picks a tile in secret, then all the pieces move at once. */
export const SINKING_TILES_TOGETHER: BoardGameConfig<TilesState, TilesMove> = {
  ...SHARED,
  game: sinkingTilesTogether,
  roomId: "sinking-tiles-together",
  tagline: "Everyone picks a tile at the same time, then all the pieces move at once.",
  // Picks are secret, so this can't be played on one phone.
  passAndPlay: false,
  choosesFirst: false,
  seatNote: (state, seat) => {
    if (state.at[seat] === null) return "fell in";
    return state.turn !== null && state.picks[seat] !== null ? "picked" : null;
  },
  prompt: "Pick a tile. Everyone moves at once.",
  othersTurn: () => "Waiting for everyone to pick...",
  // Bots take a moment each, like people deciding. Once you're out, they hurry.
  botDelayMs: (state) => (state.at[0] === null ? 300 : 900),
  sound: (state) => {
    // Picks are quiet. The sound comes when the round is played.
    if (state.picks.some((pick) => pick !== null)) return null;
    if (state.last?.fell.length) return "sunk";
    if (state.last?.bumps.length) return "miss";
    return state.last?.sank.length ? "splash" : "hop";
  },
};
