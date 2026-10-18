"use client";

import { useEffect, useState } from "react";
import type { Seat } from "@laro/games";
import { chooseMove, legalMoves, result, setup, storeOf } from "@laro/games/sungka";
import { Board } from "./Board";
import { latestNotice } from "./notices";
import { PlayerRow, PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "./parts";
import { RulesButton } from "./Rules";
import { LEVEL_LABELS, seatNames, type SungkaSettings } from "./settings";
import { DELAYS, useSowing, type Speed } from "./useSowing";

const BOT_SEAT: Seat = 1;

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

  // In a bot game the messages talk to the player at the bottom. In pass and play they use names.
  const shownNotice = outcome ? null : latestNotice(events, vsBot ? ["You", "The bot"] : names, vsBot ? 0 : null);
  const mover = sowing ? null : game.turn;
  const playing = sowing?.seat ?? game.turn;
  let status: string;
  if (playing === null) status = "Game over";
  else if (vsBot && playing === BOT_SEAT) status = "Bot's turn...";
  else if (vsBot) status = sowing ? "Your move..." : "Your turn. Pick a house.";
  else if (sowing) status = `${names[playing]}'s move...`;
  else status = `${names[playing]}, your turn (${playing === 0 ? "bottom" : "top"})`;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onExit} className="text-sm text-muted hover:text-ink">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSpeed(speed === "normal" ? "fast" : "normal")}
            aria-pressed={speed === "fast"}
            aria-label="Faster"
            className="h-9 rounded-lg border border-line px-3 text-sm font-semibold aria-pressed:bg-ink aria-pressed:text-bg"
          >
            2x
          </button>
          <RulesButton />
        </div>
      </div>

      <PlayerRow
        name={vsBot ? `Bot (${LEVEL_LABELS[settings.level]})` : names[1]}
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
          <ResultCard
            title={resultTitle(outcome.winners, settings)}
            detail={`${names[0]} ${outcome.scores[0]}, ${names[1]} ${outcome.scores[1]}`}
          >
            <button type="button" onClick={onRematch} className={PRIMARY_BUTTON} autoFocus>
              Play again
            </button>
            <button type="button" onClick={onExit} className={SECONDARY_BUTTON}>
              Change settings
            </button>
          </ResultCard>
        )}
      </div>

      <PlayerRow name={names[0]} store={board[storeOf(0)]} active={mover === 0} />

      <StatusLine notice={shownNotice} status={status} />
    </main>
  );
}

function resultTitle(winners: Seat[], settings: SungkaSettings): string {
  const [winner] = winners;
  if (winner === undefined) return "It's a tie";
  if (settings.mode === "bot") return winner === 0 ? "You win" : "You lose";
  return `${seatNames(settings.mode)[winner]} wins`;
}
