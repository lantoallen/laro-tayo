import type { ComponentType } from "react";
import type { Game, Seat } from "@laro/games";
import type { GameId } from "@laro/rooms";
import type { Notice } from "@/components/game/parts";

export interface BoardProps<State, Move> {
  state: State;
  /** Plays a move. Missing while the player looking at the board can't move. */
  onMove?: (move: Move) => void;
}

/**
 * Everything the shared two-player screens need to know about one game. The
 * rules come from `game`; the rest is how the game looks and talks.
 */
export interface BoardGameConfig<State, Move> {
  game: Game<State, Move, unknown>;
  href: string;
  /** The game's id on the room server, once it can be played online. */
  roomId?: GameId;
  /** One line under the name on the setup screen. */
  tagline: string;
  /** What each seat is called in pass and play, seat 0 first. */
  colors: readonly [string, string];
  Board: ComponentType<BoardProps<State, Move>>;
  Rules: ComponentType;
  /** The number shown next to each player's name. */
  stat: { label: string; value: (state: State, seat: Seat) => number };
  /** Said after "Your turn." */
  prompt: string;
  /**
   * A message about the last move. `you` is the seat of whoever is looking at
   * the screen, or null in pass and play, where every message uses names.
   */
  notice?: (state: State, names: readonly [string, string], you: Seat | null) => Notice | null;
  /** The line under "You win" once the game is over. */
  resultDetail: (state: State, names: readonly [string, string]) => string;
}

/** "You win", "Red wins", or a draw. `you` is null in pass and play. */
export function resultTitle(winners: Seat[], names: readonly [string, string], you: Seat | null): string {
  const [winner] = winners;
  if (winner === undefined) return "It's a draw";
  if (you !== null) return winner === you ? "You win" : "You lose";
  return `${names[winner]} wins`;
}
