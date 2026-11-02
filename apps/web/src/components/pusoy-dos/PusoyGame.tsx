"use client";

import { useEffect, useState } from "react";
import type { BotLevel, Seat } from "@laro/games";
import {
  chooseMove,
  play,
  result,
  setup,
  viewFor,
  type PusoyEvent,
  type PusoyMove,
} from "@laro/games/pusoy-dos";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { SoundButton } from "@/components/game/SoundButton";
import { PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON } from "@/components/game/parts";
import { LEVEL_LABELS } from "@/components/game/settings";
import { useRecordResult } from "@/lib/record";
import { playSound, useResultSound } from "@/lib/sound";
import { PusoyTable } from "./PusoyTable";
import { Rules } from "./Rules";

const YOU: Seat = 0;
const NAMES = ["You", "Bot 1", "Bot 2", "Bot 3"];
/** How long a bot waits before playing, so people can follow along. */
const THINK_MS = { normal: 900, fast: 350 };

type Speed = keyof typeof THINK_MS;

/** Pusoy Dos against bots on this phone. */
export function PusoyGame({
  level,
  players,
  onRematch,
  onExit,
}: {
  level: BotLevel;
  /** How many at the table, counting you. */
  players: number;
  onRematch: () => void;
  onExit: () => void;
}) {
  const [game, setGame] = useState(() => setup({ seats: players }));
  const [events, setEvents] = useState<PusoyEvent[]>([]);
  const [speed, setSpeed] = useState<Speed>("normal");

  function apply(seat: Seat, move: PusoyMove) {
    const outcome = play(game, seat, move);
    playSound(move.length === 0 ? "tap" : "flip");
    setGame(outcome.state);
    setEvents(outcome.events);
  }

  // Let the bots take their turns after a short pause.
  const botTurn = game.turn !== null && game.turn !== YOU ? game.turn : null;
  useEffect(() => {
    if (botTurn === null) return;
    const timer = setTimeout(() => {
      apply(botTurn, chooseMove(game, botTurn, { level, rng: Math.random }));
    }, THINK_MS[speed]);
    return () => clearTimeout(timer);
    // `apply` is recreated every render but only reads `game`, which changes with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botTurn, game, level, speed]);

  const outcome = result(game);
  useResultSound(outcome?.winners ?? null, YOU);
  useRecordResult("pusoy-dos", level, outcome?.winners ?? null, YOU);
  const others = Array.from({ length: players - 1 }, (_, i) => i + 1);

  return (
    <PusoyTable
      view={viewFor(game, YOU)}
      you={YOU}
      names={NAMES}
      canMove={game.turn === YOU}
      onMove={(move) => apply(YOU, move)}
      events={events}
      waiting="Thinking..."
      topBar={
        <div className="flex items-center justify-between gap-2">
          <LeaveButton
            label="← Back"
            ask={game.turns > 0 && game.turn !== null}
            title="Leave this game?"
            detail="The game ends and the cards aren't saved."
            leaveLabel="Leave game"
            onLeave={onExit}
          />
          <span className="text-sm text-muted">Bots: {LEVEL_LABELS[level]}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpeed(speed === "normal" ? "fast" : "normal")}
              aria-pressed={speed === "fast"}
              aria-label="2x speed"
              className="btn btn-secondary btn-small h-9 aria-pressed:bg-yellow aria-pressed:text-yellow-ink"
            >
              2x
            </button>
            <SoundButton />
            <RulesButton firstVisit="pusoy-dos">
              <Rules />
            </RulesButton>
          </div>
        </div>
      }
      result={
        outcome && (
          <ResultCard
            title={outcome.winners[0] === YOU ? "You win" : `${NAMES[outcome.winners[0]]} wins`}
            celebrate={outcome.winners[0] === YOU}
            detail={`Cards left: ${[...others, YOU]
              .filter((seat) => seat !== outcome.winners[0])
              .map((seat) => `${NAMES[seat]} ${outcome.scores[seat]}`)
              .join(", ")}`}
          >
            <button type="button" onClick={onRematch} className={PRIMARY_BUTTON} autoFocus>
              Deal again
            </button>
            <button type="button" onClick={onExit} className={SECONDARY_BUTTON}>
              Change settings
            </button>
          </ResultCard>
        )
      }
    />
  );
}
