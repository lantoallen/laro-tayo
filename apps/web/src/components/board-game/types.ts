import type { ComponentType } from "react";
import type { Game, Seat } from "@laro/games";
import type { GameId } from "@laro/rooms";
import type { Notice } from "@/components/game/parts";
import type { SoundName } from "@/lib/sound";

export interface BoardProps<State, Move> {
  state: State;
  /** The seat of whoever is looking at the board, or null in pass and play and for someone watching. */
  you: Seat | null;
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
  /** What each seat is called in pass and play, seat 0 first, with one for every seat the game allows. */
  colors: readonly string[];
  /** The color each seat plays as, from SEAT_COLORS, for its row and its turn badge. */
  swatches: readonly string[];
  Board: ComponentType<BoardProps<State, Move>>;
  Rules: ComponentType;
  /** The number shown next to each player's name. */
  stat: { label: string; value: (state: State, seat: Seat) => number };
  /** What to do on your turn, like "Pick a column." */
  prompt: string | ((state: State) => string);
  /** False for games with hidden pieces, which can't be shared on one screen. */
  passAndPlay?: boolean;
  /** How long the bot waits before each move. */
  botDelayMs?: number;
  /** False for games of pure luck, where a bot level would mean nothing. */
  botLevels?: boolean;
  /**
   * A message about the last move. `you` is the seat of whoever is looking at
   * the screen, or null in pass and play, where every message uses names.
   */
  notice?: (state: State, names: readonly string[], you: Seat | null) => Notice | null;
  /** The line under "You win" once the game is over. */
  resultDetail: (state: State, names: readonly string[]) => string;
  /** The sound for the move that led to this position. `you` is null in pass and play. */
  sound: (state: State, you: Seat | null) => SoundName | null;
}

export function promptFor<State, Move>(config: BoardGameConfig<State, Move>, state: State): string {
  return typeof config.prompt === "string" ? config.prompt : config.prompt(state);
}
