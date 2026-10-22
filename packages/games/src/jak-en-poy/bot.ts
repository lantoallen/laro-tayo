import { pick } from "../engine/rng";
import { IllegalMoveError, type BotOptions, type Seat } from "../engine/types";
import { BEATS, CHOICES, otherSeat, view, type Choice, type JakMove, type JakState } from "./rules";

/** The choice that beats `choice`. */
const beater = (choice: Choice) => CHOICES.find((c) => BEATS[c] === choice)!;

/**
 * Picks without seeing this round's other pick. Easy and medium pick at
 * random, which can't be beaten in the long run. Hard looks at what the other
 * player has picked most often and plays what beats it, part of the time.
 */
export function chooseMove(state: JakState, seat: Seat, { level, rng }: BotOptions): JakMove {
  const seen = view(state, seat);
  if (seen.turn !== seat) throw new IllegalMoveError(`It's not seat ${seat}'s turn`);
  if (level !== "hard" || seen.rounds.length < 2 || rng() < 0.4) return pick(rng, CHOICES);

  const theirs = seen.rounds.map((round) => round.picks[otherSeat(seat)]);
  const counts = CHOICES.map((choice) => theirs.filter((c) => c === choice).length);
  const favorite = CHOICES[counts.indexOf(Math.max(...counts))];
  return beater(favorite);
}
