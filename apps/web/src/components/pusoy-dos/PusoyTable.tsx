"use client";

import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import type { Seat } from "@laro/games";
import {
  beats,
  chooseMoveFromView,
  describe,
  legalMoves,
  passedSeats,
  rankOf,
  suitOf,
  type Card,
  type PusoyEvent,
  type PusoyMove,
  type PusoyView,
} from "@laro/games/pusoy-dos";
import { StatusLine, type Notice } from "@/components/game/parts";
import { SEAT_COLORS } from "@/components/game/settings";
import { CardBack, PlayingCard } from "./PlayingCard";
import { label, noticeFor, playName } from "./words";

/** Columns for the other players' boxes, so they fill the row. */
const COLUMNS: Record<number, string> = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-2" };
/** How far a finger has to move before a press on a card becomes a drag. */
const DRAG_START_PX = 8;
/** A press on a card is handled when it ends, so a click on that card this soon after is its echo, and ignored. */
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

/**
 * The card table, from one player's side: everyone else's card counts, the
 * table, and your hand to pick and play from. Used against bots and online.
 * `you` is null for someone watching, who sees no hand.
 */
export function PusoyTable({
  view,
  you,
  names,
  canMove,
  onMove,
  events,
  waiting,
  status: statusOverride,
  notice: noticeOverride,
  seatNote,
  topBar,
  result,
  below,
}: {
  view: PusoyView;
  you: Seat | null;
  names: readonly string[];
  /** True when it's your turn and a move can be made right now. */
  canMove: boolean;
  onMove: (move: PusoyMove) => void;
  /** What happened on the last move, for the line under the table. */
  events: readonly PusoyEvent[];
  /** What to say while someone else is playing. */
  waiting: string;
  /** Shown instead of the usual line, like while reconnecting. */
  status?: string | null;
  /** Shown instead of what happened last, like an error from the server. */
  notice?: Notice | null;
  /** A word under a player's name, like "offline". */
  seatNote?: (seat: Seat) => string | undefined;
  topBar: ReactNode;
  /** The result card, shown over the table once the game ends. */
  result: ReactNode;
  /** Anything to show under the status line, like a turn clock. */
  below?: ReactNode;
}) {
  const players = view.counts.length;
  // Everyone else, in the order they play after you.
  const others =
    you === null
      ? Array.from({ length: players }, (_, seat) => seat)
      : Array.from({ length: players - 1 }, (_, i) => (you + 1 + i) % players);
  const nameOf = (seat: Seat) => (seat === you ? "You" : names[seat]);
  const passed = passedSeats(view);
  const [selected, setSelected] = useState<Card[]>([]);
  const [sortBySuit, setSortBySuit] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const yourTurn = you !== null && view.turn === you;
  const hand = [...(view.hand ?? [])].sort((a, b) =>
    sortBySuit ? suitOf(a) * 13 + rankOf(a) - (suitOf(b) * 13 + rankOf(b)) : a - b,
  );
  // Cards picked earlier that were played for you, when time ran out, aren't in your hand any more.
  const picked = selected.filter((card) => hand.includes(card)).sort((a, b) => a - b);
  const moves = yourTurn ? legalMoves(view, you) : [];
  const canPlay = canMove && picked.length > 0 && moves.some((move) => move.join() === picked.join());
  const canPass = canMove && view.table !== null;

  // Explain why the picked cards can't be played yet.
  let problem: string | null = null;
  if (yourTurn && picked.length > 0 && !moves.some((move) => move.join() === picked.join())) {
    const combo = describe(picked);
    if (!combo) problem = "Those cards aren't a hand you can play.";
    else if (view.opening !== null && !picked.includes(view.opening)) {
      problem = `Your first play has to include the ${label(view.opening)}.`;
    } else if (view.table && !beats(combo, view.table.combo)) {
      problem = `That doesn't beat ${playName(view.table.cards)}.`;
    }
  }

  function toggle(card: Card) {
    setHint(null);
    setSelected(picked.includes(card) ? picked.filter((c) => c !== card) : [...picked, card]);
  }

  // Between turns the cards can't be picked and Play turns off. Focus stays on the hand, instead of going back to
  // the top of the page, so someone using a keyboard or screen reader is one Tab from their cards next turn.
  const handRef = useRef<HTMLDivElement>(null);

  function submit(move: PusoyMove) {
    setSelected([]);
    setHint(null);
    if (handRef.current?.closest("section")?.contains(document.activeElement)) handRef.current.focus();
    onMove(move);
  }

  // Cards can also be dragged onto the table: the card pressed, plus any already picked, are played if they can be.
  const tableRef = useRef<HTMLElement>(null);
  const press = useRef<{ card: Card; x: number; y: number; moved: boolean } | null>(null);
  // The card last pressed and when, so the click some browsers send after that press doesn't count twice.
  const handled = useRef({ card: -1, at: 0 });
  const [lifted, setLifted] = useState<{ x: number; y: number; cards: Card[] } | null>(null);
  const [overTable, setOverTable] = useState(false);
  const [refused, setRefused] = useState(0);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    const card = cardFrom(event.target);
    if (!canMove || event.button !== 0 || card === null) return;
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
    const cards = picked.includes(current.card) ? picked : [...picked, current.card];
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
    handled.current = { card: current.card, at: event.timeStamp };
    // A press that didn't move is a tap, which picks the card or puts it back.
    if (!current.moved) return toggle(current.card);
    if (!inside(tableRef.current, event.clientX, event.clientY)) return;
    const cards = (picked.includes(current.card) ? picked : [...picked, current.card]).sort((a, b) => a - b);
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
    if (you === null) return;
    const move = chooseMoveFromView(view, you, { level: "hard", rng: Math.random });
    setSelected(move);
    setHint(move.length === 0 ? "Passing is your best move here." : `Try ${playName(move)}.`);
  }

  let status: string;
  if (statusOverride) status = statusOverride;
  else if (view.turn === null) status = "Game over";
  else if (!yourTurn) status = waiting;
  else if (view.opening !== null) {
    status = `You have the ${label(view.opening)}, so you go first. Your play has to include it.`;
  } else if (!view.table) status = "Your lead. Play anything.";
  else status = `Beat ${playName(view.table.cards)} or pass.`;

  const over = view.turn === null;
  const notice = noticeOverride ?? (yourTurn || over ? null : noticeFor(events, names, you ?? -1));
  const roundJustWon = events.at(-1)?.type === "roundWon";

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-3 px-4 pb-8">
      {topBar}

      <ul aria-label="Other players" className={`grid ${COLUMNS[others.length]} gap-2`}>
        {others.map((seat) => {
          const count = view.counts[seat];
          const note = seatNote?.(seat);
          return (
            <li
              key={seat}
              className={`rounded-xl border-[3px] border-outline p-2 text-center transition-colors ${
                view.turn === seat ? "bg-yellow text-yellow-ink shadow-[3px_3px_0_var(--outline)]" : "bg-surface"
              }`}
            >
              <p className="truncate font-display text-sm">{names[seat]}</p>
              <div className="mt-1 flex items-center justify-center gap-2">
                <CardBack small />
                <span className={`text-lg font-bold tabular-nums ${count === 1 ? "text-red" : ""}`}>{count}</span>
              </div>
              <p className="mt-1 h-5 truncate text-xs text-muted">
                {view.turn === seat ? (
                  <span className="font-semibold text-yellow-ink">{note ? `Their turn, ${note}` : "Their turn"}</span>
                ) : count === 1 ? (
                  <span className="font-semibold text-red">1 card left</span>
                ) : passed.includes(seat) ? (
                  "Passed"
                ) : (
                  (note ?? "")
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
          {view.table ? (
            <>
              <div className="flex flex-wrap justify-center gap-1">
                {view.table.cards.map((card) => (
                  <PlayingCard key={card} card={card} small />
                ))}
              </div>
              <p className="rounded-md bg-surface px-2 py-0.5 text-sm font-semibold">
                {nameOf(view.table.seat)} played {playName(view.table.cards)}
              </p>
            </>
          ) : (
            <p className="rounded-md bg-surface px-2 py-0.5 text-sm font-semibold">
              {roundJustWon ? "Everyone passed. New round." : "The table is empty."}
            </p>
          )}
        </section>
        {result}
      </div>

      {below}
      <StatusLine
        notice={notice}
        status={status}
        turn={
          view.turn === null
            ? null
            : yourTurn
              ? { label: "Your turn", color: SEAT_COLORS.yellow }
              : { label: `${names[view.turn]}'s turn`, color: SEAT_COLORS.black }
        }
      />

      {you !== null && (
        <section aria-label="Your hand">
          <div
            ref={handRef}
            tabIndex={-1}
            className={`pd-hand ${canMove ? "pd-hand-live" : ""}`}
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
                selected={picked.includes(card)}
                lifted={lifted?.cards.includes(card) ?? false}
                onTap={
                  canMove
                    ? (event) => {
                        const echo =
                          handled.current.card === card && event.timeStamp - handled.current.at < CLICK_AFTER_PRESS_MS;
                        if (!echo) toggle(card);
                      }
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
            ) : canMove && picked.length === 0 ? (
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
            <button type="button" onClick={suggest} disabled={!canMove} className="btn btn-secondary btn-small">
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
          {picked.length > 0 && (
            <p className="mt-2 text-center text-xs text-muted">Picked: {picked.map(label).join(" ")}</p>
          )}
        </section>
      )}
    </main>
  );
}
