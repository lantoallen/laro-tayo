"use client";

import { useEffect, useMemo, useState } from "react";
import type { Seat } from "@laro/games";
import {
  applyEvent,
  chooseMove,
  legalMoves,
  play,
  result,
  setup,
  storeOf,
  type SungkaEvent,
  type SungkaState,
} from "@laro/games/sungka";
import { Board } from "./Board";
import { RulesButton } from "./Rules";
import { LEVEL_LABELS, seatNames, type SungkaSettings } from "./settings";

type Speed = "normal" | "fast";

/** Milliseconds to show each step of a move, plus how long the bot waits before playing. */
const DELAYS: Record<Speed, Record<SungkaEvent["type"] | "think" | "settle", number>> = {
  normal: { pickup: 320, drop: 150, capture: 700, extraTurn: 600, pass: 800, gameOver: 300, think: 750, settle: 250 },
  fast: { pickup: 120, drop: 55, capture: 320, extraTurn: 280, pass: 400, gameOver: 150, think: 350, settle: 120 },
};

const BOT_SEAT: Seat = 1;

interface Notice {
  tone: "good" | "bad" | "info";
  text: string;
}

/** A move being shown step by step. The real game state only updates once it finishes. */
interface Sowing {
  seat: Seat;
  start: number[];
  events: SungkaEvent[];
  shown: number;
  final: SungkaState;
}

interface Frame {
  board: number[];
  active: number | null;
  hand: number;
  captured: number[];
  notice: Notice | null;
}

function startSowing(state: SungkaState, seat: Seat, house: number): Sowing {
  const { state: final, events } = play(state, seat, house);
  return { seat, start: state.board, events, shown: 0, final };
}

/** In a bot game the notices talk to the player at the bottom. In pass and play they use names. */
function noticeFor(event: SungkaEvent, settings: SungkaSettings): Notice | null {
  const vsBot = settings.mode === "bot";
  const names = seatNames(settings.mode);
  switch (event.type) {
    case "capture": {
      const seat = event.store === storeOf(0) ? 0 : 1;
      if (vsBot) {
        return seat === BOT_SEAT
          ? { tone: "bad", text: `Nahuli ng bot ang ${event.count} sigay` }
          : { tone: "good", text: `Huli! +${event.count} sigay` };
      }
      return { tone: "good", text: `Huli ni ${names[seat]}: +${event.count} sigay` };
    }
    case "extraTurn":
      if (vsBot) {
        return event.seat === BOT_SEAT
          ? { tone: "bad", text: "Tira ulit ang bot" }
          : { tone: "good", text: "Tira ka ulit" };
      }
      return { tone: "good", text: `Tira ulit si ${names[event.seat]}` };
    case "pass":
      if (vsBot) {
        return event.seat === BOT_SEAT
          ? { tone: "good", text: "Walang sigay ang bot, ikaw ulit" }
          : { tone: "info", text: "Wala kang sigay, laktaw ka muna" };
      }
      return { tone: "info", text: `Walang sigay si ${names[event.seat]}, laktaw muna` };
    default:
      return null;
  }
}

/** Replays the part of the move shown so far, to get what the board looks like right now. */
function frameOf(sowing: Sowing, settings: SungkaSettings): Frame {
  const frame: Frame = { board: sowing.start, active: null, hand: 0, captured: [], notice: null };
  for (const event of sowing.events.slice(0, sowing.shown)) {
    frame.board = applyEvent(frame.board, event);
    if (event.type === "pickup") {
      frame.active = event.slot;
      frame.hand = event.count;
    } else if (event.type === "drop") {
      frame.active = event.slot;
      frame.hand--;
    } else if (event.type === "capture") {
      frame.active = event.store;
      frame.captured = event.from;
    }
    frame.notice = noticeFor(event, settings) ?? frame.notice;
  }
  return frame;
}

export function SungkaGame({
  settings,
  firstSeat,
  onRematch,
  onExit,
}: {
  settings: SungkaSettings;
  firstSeat: Seat;
  onRematch: () => void;
  onExit: () => void;
}) {
  const [game, setGame] = useState(() => setup({ firstSeat }));
  const [sowing, setSowing] = useState<Sowing | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [speed, setSpeed] = useState<Speed>("normal");

  const vsBot = settings.mode === "bot";
  const names = seatNames(settings.mode);
  const frame = useMemo(() => (sowing ? frameOf(sowing, settings) : null), [sowing, settings]);
  const botToMove = vsBot && !sowing && game.turn === BOT_SEAT;
  const humanToMove = !sowing && game.turn !== null && !(vsBot && game.turn === BOT_SEAT);
  const playable = humanToMove ? legalMoves(game, game.turn!) : [];
  const outcome = sowing ? null : result(game);

  // Step through the move being shown, then commit it.
  useEffect(() => {
    if (!sowing) return;
    const finished = sowing.shown >= sowing.events.length;
    const delay = finished ? DELAYS[speed].settle : DELAYS[speed][sowing.events[sowing.shown].type];
    const timer = setTimeout(() => {
      if (finished) {
        setNotice(frameOf(sowing, settings).notice);
        setGame(sowing.final);
        setSowing(null);
      } else {
        setSowing({ ...sowing, shown: sowing.shown + 1 });
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [sowing, speed, settings]);

  // Let the bot take its turn after a short pause.
  useEffect(() => {
    if (!botToMove) return;
    const timer = setTimeout(() => {
      const house = chooseMove(game, BOT_SEAT, { level: settings.level, rng: Math.random });
      setNotice(null);
      setSowing(startSowing(game, BOT_SEAT, house));
    }, DELAYS[speed].think);
    return () => clearTimeout(timer);
  }, [botToMove, game, settings.level, speed]);

  function playHouse(house: number) {
    if (!humanToMove) return;
    setNotice(null);
    setSowing(startSowing(game, game.turn!, house));
  }

  const shownNotice = outcome ? null : (frame?.notice ?? notice);
  const mover = sowing ? null : game.turn;
  const playing = sowing?.seat ?? game.turn;
  let status: string;
  if (playing === null) status = "Tapos na ang laro";
  else if (vsBot && playing === BOT_SEAT) status = "Tira ng bot...";
  else if (vsBot) status = sowing ? "Tira mo..." : "Ikaw na. Pumili ng bahay.";
  else if (sowing) status = `Tira ni ${names[playing]}...`;
  else status = `${names[playing]}, ikaw na (${playing === 0 ? "sa ibaba" : "sa itaas"})`;

  const board = frame?.board ?? game.board;
  const noticeTone =
    shownNotice?.tone === "good"
      ? "bg-yellow text-yellow-ink"
      : shownNotice?.tone === "bad"
        ? "border border-red text-red"
        : "bg-surface";

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onExit} className="text-sm text-muted hover:text-ink">
          ← Bumalik
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSpeed(speed === "normal" ? "fast" : "normal")}
            aria-pressed={speed === "fast"}
            aria-label="Bilisan"
            className="h-9 rounded-lg border border-line px-3 text-sm font-semibold aria-pressed:bg-ink aria-pressed:text-bg"
          >
            2x
          </button>
          <RulesButton />
        </div>
      </div>

      <PlayerRow
        name={vsBot ? `Bot (${LEVEL_LABELS[settings.level].tl})` : names[1]}
        store={board[storeOf(1)]}
        active={mover === 1}
      />

      <div className="relative">
        <Board
          board={board}
          names={names}
          playable={playable}
          onPlay={playHouse}
          active={frame?.active}
          hand={frame?.hand}
          captured={frame?.captured}
        />
        {outcome && (
          <ResultCard winners={outcome.winners} scores={outcome.scores} settings={settings} onRematch={onRematch} onExit={onExit} />
        )}
      </div>

      <PlayerRow name={names[0]} store={board[storeOf(0)]} active={mover === 0} />

      <p aria-live="polite" className={`rounded-lg px-4 py-2.5 text-center font-semibold ${noticeTone}`}>
        {shownNotice?.text ?? status}
      </p>
    </main>
  );
}

function PlayerRow({ name, store, active }: { name: string; store: number; active: boolean }) {
  return (
    <div className="mx-auto flex w-full max-w-[58rem] items-center justify-between text-sm">
      <span className="flex items-center gap-2 font-semibold">
        <span aria-hidden="true" className={`size-2.5 rounded-full ${active ? "bg-yellow" : "bg-line"}`} />
        {name}
        {active && <span className="sr-only">(siya ang titira)</span>}
      </span>
      <span className="text-muted">
        Ulo: <b className="text-ink tabular-nums">{store}</b>
      </span>
    </div>
  );
}

function ResultCard({
  winners,
  scores,
  settings,
  onRematch,
  onExit,
}: {
  winners: Seat[];
  scores: number[];
  settings: SungkaSettings;
  onRematch: () => void;
  onExit: () => void;
}) {
  const vsBot = settings.mode === "bot";
  const names = seatNames(settings.mode);
  const [winner] = winners;

  let title: string;
  if (winner === undefined) title = "Tabla";
  else if (vsBot) title = winner === 0 ? "Panalo ka" : "Talo ka";
  else title = `Panalo si ${names[winner]}`;

  return (
    <div className="absolute inset-0 z-10 grid place-items-center p-4">
      <div
        role="dialog"
        aria-labelledby="result-title"
        className="w-full max-w-xs rounded-xl border border-line bg-surface p-5 text-center shadow-xl"
      >
        <h2 id="result-title" className="text-2xl font-bold">
          {title}
        </h2>
        <p className="mt-1 text-muted tabular-nums">
          {names[0]} {scores[0]}, {vsBot ? "Bot" : names[1]} {scores[1]}
        </p>
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={onRematch} className="rounded-lg bg-blue py-2.5 font-semibold text-blue-ink" autoFocus>
            Isa pa
          </button>
          <button type="button" onClick={onExit} className="rounded-lg border border-line py-2.5 font-semibold">
            Palitan ang settings
          </button>
        </div>
      </div>
    </div>
  );
}
