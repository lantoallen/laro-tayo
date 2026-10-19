"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { BotLevel, Seat } from "@laro/games";
import {
  THREE_OF_CLUBS,
  beats,
  chooseMove,
  describe,
  legalMoves,
  play,
  rankOf,
  result,
  setup,
  suitOf,
  type Card,
  type PusoyEvent,
  type PusoyMove,
} from "@laro/games/pusoy-dos";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "@/components/game/parts";
import { LEVEL_LABELS } from "@/components/game/settings";
import { CardBack, PlayingCard } from "./PlayingCard";
import { Rules } from "./Rules";
import { label, noticeFor, playName } from "./words";

const YOU: Seat = 0;
const NAMES = ["You", "Bot 1", "Bot 2", "Bot 3"];
/** How long a bot waits before playing, so people can follow along. */
const THINK_MS = { normal: 900, fast: 350 };

type Speed = keyof typeof THINK_MS;

export function PusoyGame({ level, onRematch, onExit }: { level: BotLevel; onRematch: () => void; onExit: () => void }) {
  const [game, setGame] = useState(() => setup());
  const [events, setEvents] = useState<PusoyEvent[]>([]);
  // Who passed since the last play, so their seats can say so.
  const [passed, setPassed] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [sortBySuit, setSortBySuit] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [hint, setHint] = useState<string | null>(null);

  function apply(seat: Seat, move: PusoyMove) {
    const outcome = play(game, seat, move);
    setGame(outcome.state);
    setEvents(outcome.events);
    const roundOver = outcome.events.some((event) => event.type === "roundWon");
    setPassed(move.length > 0 || roundOver ? [] : [...passed, seat]);
  }

  // Let the bots take their turns after a short pause.
  const botTurn = game.turn !== null && game.turn !== YOU ? game.turn : null;
  useEffect(() => {
    if (botTurn === null) return;
    const timer = setTimeout(() => {
      apply(botTurn, chooseMove(game, botTurn, { level, rng: Math.random }));
    }, THINK_MS[speed]);
    return () => clearTimeout(timer);
    // `apply` is recreated every render but only reads `game` and `passed`, which change with it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botTurn, game, level, speed]);

  const yourTurn = game.turn === YOU;
  const hand = [...game.hands[YOU]].sort((a, b) =>
    sortBySuit ? suitOf(a) * 13 + rankOf(a) - (suitOf(b) * 13 + rankOf(b)) : a - b,
  );
  const picked = [...selected].sort((a, b) => a - b);
  const moves = yourTurn ? legalMoves(game, YOU) : [];
  const canPlay = picked.length > 0 && moves.some((move) => move.join() === picked.join());
  const canPass = yourTurn && game.table !== null;
  const outcome = result(game);

  // Explain why the picked cards can't be played yet.
  let problem: string | null = null;
  if (yourTurn && picked.length > 0 && !canPlay) {
    const combo = describe(picked);
    if (!combo) problem = "Those cards aren't a hand you can play.";
    else if (game.opening && !picked.includes(THREE_OF_CLUBS)) problem = "Your first play has to include the 3♣.";
    else if (game.table && !beats(combo, game.table.combo)) problem = `That doesn't beat ${playName(game.table.cards)}.`;
  }

  function toggle(card: Card) {
    setHint(null);
    setSelected(selected.includes(card) ? selected.filter((c) => c !== card) : [...selected, card]);
  }

  function submit(move: PusoyMove) {
    setSelected([]);
    setHint(null);
    apply(YOU, move);
  }

  function suggest() {
    const move = chooseMove(game, YOU, { level: "hard", rng: Math.random });
    setSelected(move);
    setHint(move.length === 0 ? "Passing is your best move here." : `Try ${playName(move)}.`);
  }

  let status: string;
  if (game.turn === null) status = "Game over";
  else if (!yourTurn) status = `${NAMES[game.turn]} is thinking...`;
  else if (game.opening) status = "You have the 3♣, so you go first. Your play has to include it.";
  else if (!game.table) status = "Your lead. Play anything.";
  else status = `Beat ${playName(game.table.cards)} or pass.`;

  const notice = yourTurn || outcome ? null : noticeFor(events, NAMES, YOU);
  const roundJustWon = events.at(-1)?.type === "roundWon";

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-3 px-4 pb-8">
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
            aria-label="Faster"
            className="btn btn-secondary btn-small h-9 aria-pressed:bg-yellow aria-pressed:text-yellow-ink"
          >
            2x
          </button>
          <RulesButton>
            <Rules />
          </RulesButton>
        </div>
      </div>

      <ul aria-label="Other players" className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((seat) => {
          const count = game.hands[seat].length;
          return (
            <li
              key={seat}
              className={`rounded-xl border-[3px] bg-surface p-2 text-center ${
                game.turn === seat ? "border-yellow shadow-[3px_3px_0_var(--outline)]" : "border-outline"
              }`}
            >
              <p className="font-display text-sm">{NAMES[seat]}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <CardBack small />
                <span className={`text-lg font-bold tabular-nums ${count === 1 ? "text-red" : ""}`}>{count}</span>
              </div>
              <p className="mt-1 h-5 text-xs text-muted">
                {count === 1 ? <span className="font-semibold text-red">1 card left</span> : passed.includes(seat) ? "Passed" : ""}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="relative">
        <section
          aria-label="Table"
          className="card grid min-h-36 place-items-center gap-2 bg-[var(--wood)] p-4 text-center"
        >
          {game.table ? (
            <>
              <div className="flex flex-wrap justify-center gap-1">
                {game.table.cards.map((card) => (
                  <PlayingCard key={card} card={card} small />
                ))}
              </div>
              <p className="rounded-md bg-surface px-2 py-0.5 text-sm font-semibold">
                {NAMES[game.table.seat]} played {playName(game.table.cards)}
              </p>
            </>
          ) : (
            <p className="rounded-md bg-surface px-2 py-0.5 text-sm font-semibold">
              {roundJustWon ? "Everyone passed. New round." : "The table is empty."}
            </p>
          )}
        </section>
        {outcome && (
          <ResultCard
            title={outcome.winners[0] === YOU ? "You win" : `${NAMES[outcome.winners[0]]} wins`}
            detail={`Cards left: ${[1, 2, 3, 0]
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
        )}
      </div>

      <StatusLine notice={notice} status={status} />

      <section aria-label="Your hand">
        <div className="pd-hand" style={{ "--count": Math.max(hand.length, 2) } as CSSProperties}>
          {hand.map((card) => (
            <PlayingCard
              key={card}
              card={card}
              selected={selected.includes(card)}
              onTap={yourTurn ? () => toggle(card) : undefined}
            />
          ))}
        </div>
        <p className="mt-2 min-h-5 text-center text-sm" aria-live="polite">
          {problem ? <span className="text-red">{problem}</span> : hint ? <span className="text-muted">{hint}</span> : null}
        </p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setSortBySuit(!sortBySuit)}
            aria-label={sortBySuit ? "Sort by rank" : "Sort by suit"}
            className="btn btn-secondary btn-small"
          >
            Sort
          </button>
          <button type="button" onClick={suggest} disabled={!yourTurn} className="btn btn-secondary btn-small">
            Hint
          </button>
          <button type="button" onClick={() => submit([])} disabled={!canPass} className="btn btn-secondary btn-small">
            Pass
          </button>
          <button type="button" onClick={() => submit(picked)} disabled={!canPlay} className="btn btn-primary btn-small">
            Play
          </button>
        </div>
        {selected.length > 0 && (
          <p className="mt-2 text-center text-xs text-muted">Picked: {picked.map(label).join(" ")}</p>
        )}
      </section>
    </main>
  );
}
