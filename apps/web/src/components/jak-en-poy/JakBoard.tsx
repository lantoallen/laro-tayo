"use client";

import { useEffect } from "react";
import type { Seat } from "@laro/games";
import { BEATS, CHOICES, otherSeat, view, type Choice, type JakMove, type JakState } from "@laro/games/jak-en-poy";
import type { BoardProps } from "@/components/board-game/types";
import { playSound } from "@/lib/sound";
import "./jak.css";

const COLORS = ["Red", "Blue"] as const;
const LABELS: Record<Choice, string> = { rock: "Rock", paper: "Paper", scissors: "Scissors" };
const VERBS: Record<Choice, string> = { rock: "crushes", paper: "covers", scissors: "cut" };
/** How long the hands shake before showing what was picked, in step with the CSS. */
const REVEAL_MS = 900;

/** A rock, a sheet of paper, or a pair of scissors. */
export function ChoiceIcon({ choice }: { choice: Choice }) {
  return (
    <svg viewBox="0 0 64 64" className="jk-icon" aria-hidden="true">
      {choice === "rock" && (
        <>
          <path
            d="M10 40C8 28 18 16 32 16s24 10 22 22-14 16-24 16C18 54 11 50 10 40z"
            fill="#9aa0a6"
            stroke="#1b1b1b"
            strokeWidth="3"
          />
          <path
            d="M20 31c4-6 10-8 16-8"
            fill="none"
            stroke="#fffaf0"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      )}
      {choice === "paper" && (
        <>
          <path d="M16 8h24l10 10v38H16z" fill="#fffaf0" stroke="#1b1b1b" strokeWidth="3" strokeLinejoin="round" />
          <path d="M40 8v10h10" fill="none" stroke="#1b1b1b" strokeWidth="3" strokeLinejoin="round" />
          <path d="M22 28h22M22 36h22M22 44h16" stroke="#6b5a3e" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {choice === "scissors" && (
        <>
          <path d="M26 40 45 8M38 40 19 8" stroke="#6b7280" strokeWidth="5" strokeLinecap="round" />
          <circle cx="23" cy="48" r="7" fill="none" stroke="#ce1126" strokeWidth="4" />
          <circle cx="41" cy="48" r="7" fill="none" stroke="#ce1126" strokeWidth="4" />
          <circle cx="32" cy="27" r="2.5" fill="#1b1b1b" />
        </>
      )}
    </svg>
  );
}

/** One side of the arena: what that player showed in the last round, or whether they've picked this one. */
function Hand({ choice, picked, revealKey }: { choice: Choice | null; picked: boolean; revealKey: number }) {
  if (choice) {
    return (
      // A new key each round, so the shake and reveal play again.
      <span key={revealKey} className="jk-hand jk-reveal">
        <span className="jk-fist">
          <ChoiceIcon choice="rock" />
        </span>
        <span className="jk-shown">
          <ChoiceIcon choice={choice} />
        </span>
      </span>
    );
  }
  return <span className={`jk-hand jk-waiting ${picked ? "jk-picked" : ""}`}>{picked ? "✓" : "?"}</span>;
}

export function JakBoard({ state: full, you, onMove }: BoardProps<JakState, JakMove>) {
  // In a bot game this phone holds the bot's pick too, so only show what this player may see.
  const state = view(full, you);
  const me: Seat = you ?? 0;
  const them = otherSeat(me);
  const round = state.rounds.at(-1);
  const decided = round !== undefined && state.picks.every((pick) => pick === null);
  const roundNumber = state.rounds.length;

  // Play the round's result once the hands have shown what was picked.
  useEffect(() => {
    if (!decided || !round) return;
    const sound = round.winner === null ? "draw" : you === null || round.winner === you ? "match" : "miss";
    const timer = setTimeout(() => playSound(sound), REVEAL_MS);
    return () => clearTimeout(timer);
    // One sound per round.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNumber]);

  let headline: string;
  if (decided && round) {
    if (round.winner === null) headline = `Both picked ${round.picks[0]}. It's a tie.`;
    else {
      const winning = round.picks[round.winner];
      const losing = round.picks[otherSeat(round.winner)];
      const outcome =
        you === null
          ? `${COLORS[round.winner]} wins the round.`
          : round.winner === you
            ? "You win the round!"
            : "You lose the round.";
      headline = `${LABELS[winning]} ${VERBS[winning]} ${losing}. ${outcome}`;
    }
  } else if (state.picks[them] !== null && you !== null) headline = `${COLORS[them]} has picked.`;
  else if (you === null && state.turn !== null && state.picks[otherSeat(state.turn)] !== null) {
    headline = `${COLORS[otherSeat(state.turn)]} has picked. Pass the phone to ${COLORS[state.turn]}.`;
  } else headline = "Jak-en-poy!";

  return (
    <div className="jk">
      <section aria-label="This round" className="card jk-arena">
        <Hand
          choice={decided ? round!.picks[them] : null}
          picked={state.picks[them] !== null}
          revealKey={roundNumber}
        />
        <p key={decided ? roundNumber : -1} className={`jk-headline ${decided ? "jk-after" : ""}`} aria-live="polite">
          {decided && (
            <span className="jk-chant" aria-hidden="true">
              <span>Jak…</span> <span>en…</span> <span>poy!</span>
            </span>
          )}
          <span className="jk-result">{headline}</span>
        </p>
        <Hand choice={decided ? round!.picks[me] : null} picked={state.picks[me] !== null} revealKey={roundNumber} />
      </section>

      {onMove && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {CHOICES.map((choice) => (
            <button key={choice} type="button" onClick={() => onMove(choice)} className="jk-choice btn btn-secondary">
              <ChoiceIcon choice={choice} />
              <span>{LABELS[choice]}</span>
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-center text-xs text-muted">
        Rock {VERBS.rock} {BEATS.rock}, paper {VERBS.paper} {BEATS.paper}, scissors {VERBS.scissors} {BEATS.scissors}.
      </p>
    </div>
  );
}
