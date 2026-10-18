"use client";

import { useEffect, useState } from "react";
import type { Seat } from "@laro/games";
import { chooseMove, legalMoves, result, setup, storeOf, type SungkaEvent } from "@laro/games/sungka";
import { Board } from "./Board";
import { RulesButton } from "./Rules";
import { LEVEL_LABELS, seatNames, type SungkaSettings } from "./settings";
import { DELAYS, useSowing, type Speed } from "./useSowing";

const BOT_SEAT: Seat = 1;

interface Notice {
  tone: "good" | "bad" | "info";
  text: string;
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

/** The most recent message from the move being shown, or from the last move. */
function latestNotice(events: SungkaEvent[], settings: SungkaSettings): Notice | null {
  let notice: Notice | null = null;
  for (const event of events) notice = noticeFor(event, settings) ?? notice;
  return notice;
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
  const [speed, setSpeed] = useState<Speed>("normal");
  const { game, sowing, frame, events, board, move } = useSowing(() => setup({ firstSeat }), speed);

  const vsBot = settings.mode === "bot";
  const names = seatNames(settings.mode);
  const botToMove = vsBot && !sowing && game.turn === BOT_SEAT;
  const humanToMove = !sowing && game.turn !== null && !(vsBot && game.turn === BOT_SEAT);
  const playable = humanToMove ? legalMoves(game, game.turn!) : [];
  const outcome = sowing ? null : result(game);

  // Let the bot take its turn after a short pause.
  useEffect(() => {
    if (!botToMove) return;
    const timer = setTimeout(() => {
      move(BOT_SEAT, chooseMove(game, BOT_SEAT, { level: settings.level, rng: Math.random }));
    }, DELAYS[speed].think);
    return () => clearTimeout(timer);
    // `move` is recreated every render but only reads `game`, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botToMove, game, settings.level, speed]);

  function playHouse(house: number) {
    if (humanToMove) move(game.turn!, house);
  }

  const shownNotice = outcome ? null : latestNotice(events, settings);
  const mover = sowing ? null : game.turn;
  const playing = sowing?.seat ?? game.turn;
  let status: string;
  if (playing === null) status = "Tapos na ang laro";
  else if (vsBot && playing === BOT_SEAT) status = "Tira ng bot...";
  else if (vsBot) status = sowing ? "Tira mo..." : "Ikaw na. Pumili ng bahay.";
  else if (sowing) status = `Tira ni ${names[playing]}...`;
  else status = `${names[playing]}, ikaw na (${playing === 0 ? "sa ibaba" : "sa itaas"})`;

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
