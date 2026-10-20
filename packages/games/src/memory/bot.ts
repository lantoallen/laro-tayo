import { pick } from "../engine/rng";
import { IllegalMoveError, type BotLevel, type BotOptions, type Seat } from "../engine/types";
import { legalMoves, type MemoryMove, type MemoryState } from "./rules";

/** How likely the bot is to remember each card it has seen turned up. */
export const REMEMBERS: Record<BotLevel, number> = {
  easy: 0.3,
  medium: 0.7,
  hard: 1,
};

/**
 * Plays from memory. The bot only ever reads the faces of cards that have been
 * turned up before, so it knows no more than a player who watched every turn.
 */
export function chooseMove(state: MemoryState, seat: Seat, { level, rng }: BotOptions): MemoryMove {
  const options = legalMoves(state, seat);
  if (options.length === 0) throw new IllegalMoveError(`Seat ${seat} has no moves`);

  // The cards it remembers, by face.
  const known = new Map<number, number[]>();
  for (const card of options) {
    if (!state.seen[card] || rng() >= REMEMBERS[level]) continue;
    const face = state.faces[card];
    known.set(face, [...(known.get(face) ?? []), card]);
  }
  // With nothing better to do, turning up a new card at least teaches it something.
  const unseen = options.filter((card) => !state.seen[card]);
  const guess = () => pick(rng, unseen.length > 0 ? unseen : options);

  if (state.flipped.length === 1) {
    // The first card is face up, so it knows which face it's looking for.
    return known.get(state.faces[state.flipped[0]])?.[0] ?? guess();
  }
  const pairs = [...known.values()].filter((cards) => cards.length >= 2);
  return pairs.length > 0 ? pick(rng, pairs)[0] : guess();
}
