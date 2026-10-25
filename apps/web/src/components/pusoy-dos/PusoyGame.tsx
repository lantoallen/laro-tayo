"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { BotLevel, Seat } from "@laro/games";
import {
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
import { SoundButton } from "@/components/game/SoundButton";
import { PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "@/components/game/parts";
import { LEVEL_LABELS, SEAT_COLORS } from "@/components/game/settings";
import { useRecordResult } from "@/lib/record";
import { playSound, useResultSound } from "@/lib/sound";
import { CardBack, PlayingCard } from "./PlayingCard";
import { Rules } from "./Rules";
import { label, noticeFor, playName } from "./words";

const YOU: Seat = 0;
const NAMES = ["You", "Bot 1", "Bot 2", "Bot 3"];
/** Columns for the other players' boxes, so they fill the row. */
const COLUMNS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };
/** How long a bot waits before playing, so people can follow along. */
const THINK_MS = { normal: 900, fast: 350 };
/** How far a finger has to move before a press on a card becomes a drag. */
const DRAG_START_PX = 8;
/** A press on a card is handled when it ends, so a click this soon after is the browser's echo of it, and ignored. */
const CLICK_AFTER_PRESS_MS = 500;

/** The card a pointer event happened on, from the `data-card` on each card in the hand. */
function cardFrom(target: EventTarget | null): Card | null {
  const element = target instanceof Element ? target.closest<HTMLElement>("[data-card]") : null;
  return element ? Number(element.dataset.card) : null;
}

const inside = (element: Element | null, x: number, y: number) => {
  const box = element?.getBoundingClientRect();
  return box !== undefined && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
};

type Speed = keyof typeof THINK_MS;

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
  const others = Array.from({ length: players - 1 }, (_, i) => i + 1);
  const [events, setEvents] = useState<PusoyEvent[]>([]);
  // Who passed since the last play, so their seats can say so.
  const [passed, setPassed] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<Card[]>([]);
  const [sortBySuit, setSortBySuit] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [hint, setHint] = useState<string | null>(null);

  function apply(seat: Seat, move: PusoyMove) {
    const outcome = play(game, seat, move);
    playSound(move.length === 0 ? "tap" : "flip");
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
  useResultSound(outcome?.winners ?? null, YOU);
  useRecordResult("pusoy-dos", level, outcome?.winners ?? null, YOU);

  // Explain why the picked cards can't be played yet.
  let problem: string | null = null;
  if (yourTurn && picked.length > 0 && !canPlay) {
    const combo = describe(picked);
    if (!combo) problem = "Those cards aren't a hand you can play.";
    else if (game.opening !== null && !picked.includes(game.opening)) {
      problem = `Your first play has to include the ${label(game.opening)}.`;
    } else if (game.table && !beats(combo, game.table.combo)) {
      problem = `That doesn't beat ${playName(game.table.cards)}.`;
    }
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

  // Cards can also be dragged onto the table: the card pressed, plus any already picked, are played if they can be.
  const handRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLElement>(null);
  const press = useRef<{ card: Card; x: number; y: number; moved: boolean } | null>(null);
  // When a press on a card was last dealt with, so the click some browsers send after it doesn't count twice.
  const handledAt = useRef(0);
  const [lifted, setLifted] = useState<{ x: number; y: number; cards: Card[] } | null>(null);
  const [overTable, setOverTable] = useState(false);
  const [refused, setRefused] = useState(0);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const card = cardFrom(event.target);
    if (!yourTurn || event.button !== 0 || card === null) return;
    press.current = { card, x: event.clientX, y: event.clientY, moved: false };
    // Follow this pointer wherever it goes, even off the hand, until it lets go.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // The pointer is already gone.
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = press.current;
    if (!current) return;
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < DRAG_START_PX) return;
    const cards = selected.includes(current.card) ? selected : [...selected, current.card];
    if (!current.moved) {
      current.moved = true;
      setHint(null);
      setSelected(cards);
    }
    setLifted({ x: event.clientX, y: event.clientY, cards: [...cards].sort((a, b) => a - b) });
    setOverTable(inside(tableRef.current, event.clientX, event.clientY));
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const current = press.current;
    press.current = null;
    setLifted(null);
    setOverTable(false);
    if (!current) return;
    handledAt.current = event.timeStamp;
    // A press that didn't move is a tap, which picks the card or puts it back.
    if (!current.moved) return toggle(current.card);
    if (!inside(tableRef.current, event.clientX, event.clientY)) return;
    const cards = (selected.includes(current.card) ? selected : [...selected, current.card]).sort((a, b) => a - b);
    // Played if it's a legal play. If not, the cards stay picked and the line under the hand says why.
    if (moves.some((move) => move.join() === cards.join())) submit(cards);
    else setRefused(refused + 1);
  }

  function onPointerCancel() {
    press.current = null;
    setLifted(null);
    setOverTable(false);
  }

  function suggest() {
    const move = chooseMove(game, YOU, { level: "hard", rng: Math.random });
    setSelected(move);
    setHint(move.length === 0 ? "Passing is your best move here." : `Try ${playName(move)}.`);
  }

  let status: string;
  if (game.turn === null) status = "Game over";
  else if (!yourTurn) status = "Thinking...";
  else if (game.opening !== null) {
    status = `You have the ${label(game.opening)}, so you go first. Your play has to include it.`;
  } else if (!game.table) status = "Your lead. Play anything.";
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
          <SoundButton />
          <RulesButton firstVisit="pusoy-dos">
            <Rules />
          </RulesButton>
        </div>
      </div>

      <ul aria-label="Other players" className={`grid ${COLUMNS[others.length]} gap-2`}>
        {others.map((seat) => {
          const count = game.hands[seat].length;
          return (
            <li
              key={seat}
              className={`rounded-xl border-[3px] border-outline p-2 text-center transition-colors ${
                game.turn === seat ? "bg-yellow text-yellow-ink shadow-[3px_3px_0_var(--outline)]" : "bg-surface"
              }`}
            >
              <p className="font-display text-sm">{NAMES[seat]}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <CardBack small />
                <span className={`text-lg font-bold tabular-nums ${count === 1 ? "text-red" : ""}`}>{count}</span>
              </div>
              <p className="mt-1 h-5 text-xs text-muted">
                {game.turn === seat ? (
                  <span className="font-semibold text-yellow-ink">Their turn</span>
                ) : count === 1 ? (
                  <span className="font-semibold text-red">1 card left</span>
                ) : passed.includes(seat) ? (
                  "Passed"
                ) : (
                  ""
                )}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="relative">
        <section
          ref={tableRef}
          key={refused}
          aria-label="Table"
          className={`card grid min-h-36 place-items-center gap-2 bg-[var(--wood)] p-4 text-center ${
            lifted ? "pd-drop" : ""
          } ${overTable ? "pd-drop-over" : ""} ${refused > 0 ? "pd-refused" : ""}`}
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
        )}
      </div>

      <StatusLine
        notice={notice}
        status={status}
        turn={
          game.turn === null
            ? null
            : yourTurn
              ? { label: "Your turn", color: SEAT_COLORS.yellow }
              : { label: `${NAMES[game.turn]}'s turn`, color: SEAT_COLORS.black }
        }
      />

      <section aria-label="Your hand">
        <div
          ref={handRef}
          className={`pd-hand ${yourTurn ? "pd-hand-live" : ""}`}
          style={{ "--count": Math.max(hand.length, 2) } as CSSProperties}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          {hand.map((card) => (
            <PlayingCard
              key={card}
              card={card}
              selected={selected.includes(card)}
              lifted={lifted?.cards.includes(card) ?? false}
              onTap={
                yourTurn
                  ? (event) => (event.timeStamp - handledAt.current > CLICK_AFTER_PRESS_MS ? toggle(card) : undefined)
                  : undefined
              }
            />
          ))}
        </div>
        <p className="mt-2 min-h-5 text-center text-sm" aria-live="polite">
          {problem ? (
            <span className="text-red">{problem}</span>
          ) : hint ? (
            <span className="text-muted">{hint}</span>
          ) : yourTurn && selected.length === 0 ? (
            <span className="text-muted">Tap cards to pick them, or drag them onto the table to play.</span>
          ) : null}
        </p>
        {lifted && (
          <div className="pd-dragged" style={{ left: lifted.x, top: lifted.y }} aria-hidden="true">
            {lifted.cards.map((card) => (
              <PlayingCard key={card} card={card} small />
            ))}
          </div>
        )}
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
          <button
            type="button"
            onClick={() => submit(picked)}
            disabled={!canPlay}
            className="btn btn-primary btn-small"
          >
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
