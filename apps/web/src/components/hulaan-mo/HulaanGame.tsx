"use client";

import { useEffect, useReducer, useState } from "react";
import {
  HulaanError,
  createGame,
  leaders,
  reduce,
  type HulaanAction,
  type HulaanSettings,
  type HulaanState,
} from "@laro/games/hulaan-mo";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { SoundButton } from "@/components/game/SoundButton";
import { playSound, useResultSound } from "@/lib/sound";
import { Rules } from "./Rules";
import { TEAM_CLASSES, teamName } from "./settings";

const COUNTDOWN_FROM = 3;

/**
 * Sizes the word so its longest part fits across the card. A Bungee letter is
 * about 0.75em wide, so this leaves a little room to spare.
 */
function wordSize(word: string): string {
  const longest = Math.max(...word.split(" ").map((part) => part.length));
  return `min(3rem, ${(100 / (longest * 0.8)).toFixed(2)}cqi)`;
}

/** Ignores actions that arrive out of order, like a second "time's up" from a timer that fired twice. */
function safeReduce(state: HulaanState, action: HulaanAction): HulaanState {
  try {
    return reduce(state, action);
  } catch (error) {
    if (error instanceof HulaanError) return state;
    throw error;
  }
}

export function HulaanGame({
  settings,
  onRematch,
  onExit,
}: {
  settings: HulaanSettings;
  onRematch: () => void;
  onExit: () => void;
}) {
  const [game, dispatch] = useReducer(safeReduce, settings, (s) => createGame(s));
  const [countdown, setCountdown] = useState<number | null>(null);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(0);
  const playing = game.phase === "playing";

  // Count down 3, 2, 1, then start the timer.
  useEffect(() => {
    if (countdown === null) return;
    const timer = setTimeout(() => {
      if (countdown > 1) {
        playSound("tick");
        setCountdown(countdown - 1);
        return;
      }
      playSound("go");
      const start = Date.now();
      setCountdown(null);
      setNow(start);
      setEndsAt(start + settings.seconds * 1000);
      dispatch({ type: "start" });
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, settings.seconds]);

  // Run the turn's clock, and end the turn when it hits zero.
  useEffect(() => {
    if (!playing) return;
    const tick = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= endsAt) {
        clearInterval(tick);
        navigator.vibrate?.(300);
        playSound("buzz");
        dispatch({ type: "timeUp" });
      }
    }, 200);
    return () => clearInterval(tick);
  }, [playing, endsAt]);

  // Keep the screen on while the phone is up on someone's forehead.
  const holdingUp = playing || countdown !== null;
  useEffect(() => {
    if (!holdingUp) return;
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then((sentinel) => {
        lock = sentinel;
      })
      .catch(() => {
        // Not every browser allows this. The game still works.
      });
    return () => {
      lock?.release().catch(() => {});
    };
  }, [holdingUp]);

  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1000));
  useResultSound(game.phase === "over" ? leaders(game) : null, null);

  // Tick through the last five seconds so the team knows time is nearly up.
  useEffect(() => {
    if (playing && secondsLeft > 0 && secondsLeft <= 5) playSound("tick");
  }, [playing, secondsLeft]);
  const started = game.round > 0 || game.team > 0 || game.phase !== "ready";
  const lastTurn = game.team === settings.teams - 1 && game.round === settings.rounds - 1;
  const guessed = game.turnWords.filter((result) => result.got).length;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-10">
      <div className="flex items-center justify-between gap-2">
        <LeaveButton
          label="← Back"
          ask={started && game.phase !== "over"}
          title="Leave this game?"
          detail="The scores aren't saved."
          leaveLabel="Leave game"
          onLeave={onExit}
        />
        <div className="flex items-center gap-2">
          <SoundButton />
          <RulesButton firstVisit="hulaan-mo">
            <Rules />
          </RulesButton>
        </div>
      </div>

      {!holdingUp && <Scores scores={game.scores} highlight={game.phase === "over" ? leaders(game) : [game.team]} />}

      {game.phase === "ready" && countdown === null && (
        <section className="card p-5 text-center">
          <p className={`mx-auto w-fit rounded-lg px-3 py-1 font-display ${TEAM_CLASSES[game.team]}`}>
            {teamName(game.team)}
          </p>
          <h1 className="mt-3 text-2xl">Your turn</h1>
          <p className="mt-1 text-sm text-muted">
            Turn {game.round + 1} of {settings.rounds}
          </p>
          <p className="mt-4 text-pretty">
            Pick one guesser. They hold the phone up to their forehead with the screen facing the team.
          </p>
          <p className="mt-2 text-sm text-muted">The rest of the team answers with only yes, no, or maybe.</p>
          <button type="button" onClick={() => {
              playSound("tick");
              setCountdown(COUNTDOWN_FROM);
            }} className="btn btn-primary mt-6 w-full py-3.5">
            Start the timer
          </button>
        </section>
      )}

      {countdown !== null && (
        <section className="card grid min-h-80 place-items-center p-5 text-center" aria-live="assertive">
          <div>
            <p className="font-display text-8xl">{countdown}</p>
            <p className="mt-4 font-semibold">Hold the phone up to your forehead</p>
          </div>
        </section>
      )}

      {playing && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-outline bg-surface">
              <div
                className={`h-full ${secondsLeft <= 10 ? "bg-red" : "bg-yellow"}`}
                style={{ width: `${(secondsLeft / settings.seconds) * 100}%` }}
              />
            </div>
            <span className="w-12 text-right font-display text-xl tabular-nums" aria-label={`${secondsLeft} seconds left`}>
              {secondsLeft}
            </span>
          </div>
          <div className="card @container grid min-h-64 place-items-center p-6 text-center">
            <p
              className="font-display leading-tight break-words"
              style={{ fontSize: game.word ? wordSize(game.word) : undefined }}
              aria-live="polite"
            >
              {game.word}
            </p>
          </div>
          <p className="text-center text-sm text-muted">
            {teamName(game.team)}: {guessed} so far. Answer only yes, no, or maybe.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                playSound("flip");
                dispatch({ type: "skip" });
              }}
              className="btn btn-secondary py-6 text-lg"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => {
                playSound("match");
                dispatch({ type: "got" });
              }}
              className="btn btn-primary py-6 text-lg"
            >
              Got it
            </button>
          </div>
        </section>
      )}

      {game.phase === "summary" && (
        <section className="card p-5">
          <h1 className="text-2xl">Time&apos;s up</h1>
          <p className="mt-1 text-muted">
            {teamName(game.team)} got {guessed} {guessed === 1 ? "word" : "words"}.
          </p>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {game.turnWords.map((result, i) => (
              <li key={`${result.word}-${i}`} className="flex items-center justify-between py-2">
                <span className="font-semibold">{result.word}</span>
                <span className={result.got ? "font-semibold text-blue" : "text-muted"}>
                  {result.got ? "Got it" : "Missed"}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => dispatch({ type: "next" })} className="btn btn-primary mt-5 w-full">
            {lastTurn
              ? "See the scores"
              : `Next: ${teamName(game.team === settings.teams - 1 ? 0 : game.team + 1)}`}
          </button>
        </section>
      )}

      {game.phase === "over" && <Final state={game} onRematch={onRematch} onExit={onExit} />}
    </main>
  );
}

function Scores({ scores, highlight }: { scores: number[]; highlight: number[] }) {
  return (
    <ul aria-label="Scores" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {scores.map((score, team) => (
        <li
          key={team}
          className={`flex items-center justify-between rounded-xl border-[3px] px-3 py-2 ${
            highlight.includes(team) ? "border-outline shadow-[3px_3px_0_var(--outline)]" : "border-line"
          } bg-surface`}
        >
          <span className={`rounded-md px-2 py-0.5 font-display text-xs ${TEAM_CLASSES[team]}`}>{teamName(team)}</span>
          <span className="font-display text-xl tabular-nums">{score}</span>
        </li>
      ))}
    </ul>
  );
}

/** "Team 1", "Team 1 and Team 2", "Team 1, Team 2 and Team 3". */
function listTeams(teams: number[]): string {
  const names = teams.map(teamName);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function Final({ state, onRematch, onExit }: { state: HulaanState; onRematch: () => void; onExit: () => void }) {
  const top = leaders(state);
  const best = state.scores[top[0]];
  const words = best === 1 ? "word" : "words";
  return (
    <section className="card p-5 text-center">
      <h1 className="text-3xl">{top.length === 1 ? `${teamName(top[0])} wins` : "It's a tie"}</h1>
      <p className="mt-1 text-muted">
        {top.length === 1
          ? `They guessed ${best} ${words}.`
          : `${listTeams(top)} ${top.length === 2 ? "both" : "all"} guessed ${best} ${words}.`}
      </p>
      <div className="mt-5 grid gap-2">
        <button type="button" onClick={onRematch} className="btn btn-primary" autoFocus>
          Play again
        </button>
        <button type="button" onClick={onExit} className="btn btn-secondary">
          Change settings
        </button>
      </div>
    </section>
  );
}
