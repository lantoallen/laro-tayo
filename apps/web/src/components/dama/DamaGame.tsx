"use client";

import { useEffect, useState } from "react";
import type { Seat } from "@laro/games";
import { chooseMove, countPieces, fullMoves, legalMoves, result, setup } from "@laro/games/dama";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { PlayerRow, PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "@/components/game/parts";
import { LEVEL_LABELS } from "@/components/game/settings";
import { DamaBoard } from "./DamaBoard";
import { Rules } from "./Rules";
import { latestNotice } from "./notices";
import { seatNames, type DamaSettings } from "./settings";
import { DELAYS, useDamaPlayback, type Speed } from "./useDamaPlayback";

const BOT_SEAT: Seat = 1;

const samePrefix = (move: number[], prefix: number[]) => prefix.every((square, i) => move[i] === square);

export function DamaGame({
  settings,
  firstSeat,
  onRematch,
  onExit,
}: {
  settings: DamaSettings;
  firstSeat: Seat;
  onRematch: () => void;
  onExit: () => void;
}) {
  const [speed, setSpeed] = useState<Speed>("normal");
  const { game, playing, frame, board, last, events, mover, move } = useDamaPlayback(() => setup({ firstSeat }), speed);
  // The piece being moved, then any landing squares picked so far.
  const [selection, setSelection] = useState<number[]>([]);

  const vsBot = settings.mode === "bot";
  const names = seatNames(settings.mode);
  const botToMove = vsBot && !playing && game.turn === BOT_SEAT;
  const humanSeat = !playing && game.turn !== null && !(vsBot && game.turn === BOT_SEAT) ? game.turn : null;
  const moves = humanSeat === null ? [] : legalMoves(game, humanSeat);
  const mustCapture = humanSeat !== null && fullMoves(game.board, humanSeat).some((m) => m.captured.length > 0);
  const movable = [...new Set(moves.map((m) => m[0]))];
  const targets =
    selection.length === 0
      ? []
      : [
          ...new Set(
            moves.filter((m) => m.length > selection.length && samePrefix(m, selection)).map((m) => m[selection.length]),
          ),
        ];
  const outcome = playing ? null : result(game);

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

  function tap(square: number) {
    if (humanSeat === null) return;
    if (targets.includes(square)) {
      const next = [...selection, square];
      const complete = moves.find((m) => m.length === next.length && samePrefix(m, next));
      if (complete) {
        setSelection([]);
        move(humanSeat, complete);
      } else {
        setSelection(next);
      }
    } else if (movable.includes(square) && selection.length <= 1) {
      setSelection(selection[0] === square ? [] : [square]);
    }
  }

  const turnName = humanSeat === null ? "" : vsBot ? "Your turn" : `${names[humanSeat]}'s turn`;
  let status: string;
  if (game.turn === null && !playing) status = "Game over";
  else if (playing) status = mover === BOT_SEAT && vsBot ? "Bot's turn..." : vsBot ? "Your move..." : `${names[mover!]}'s move...`;
  else if (humanSeat === null) status = "Bot's turn...";
  else if (selection.length > 1) status = "Keep jumping. Tap the next square.";
  else if (selection.length === 1) status = mustCapture ? "Tap where to jump." : "Tap where to move it.";
  else status = mustCapture ? `${turnName}. You have to capture.` : `${turnName}. Pick a piece.`;

  // In a bot game the messages talk to the player at the bottom. In pass and play they use names.
  const notice =
    outcome || selection.length > 0
      ? null
      : latestNotice(events, mover, vsBot ? ["You", "The bot"] : names, vsBot ? 0 : null);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <LeaveButton
          label="← Back"
          ask={game.turns > 0 && game.turn !== null}
          title="Leave this game?"
          detail="The game ends and the board isn't saved."
          leaveLabel="Leave game"
          onLeave={onExit}
        />
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

      <PlayerRow
        name={vsBot ? `Bot (${LEVEL_LABELS[settings.level]})` : `${names[1]}, top`}
        stat={{ label: "Pieces", value: countPieces(board, 1) }}
        active={!playing && game.turn === 1}
      />

      <div className="relative mx-auto w-full max-w-[32rem]">
        <DamaBoard
          board={board}
          movable={movable}
          targets={targets}
          path={selection}
          captured={frame?.captured}
          last={last}
          onTap={humanSeat === null ? undefined : tap}
        />
        {outcome && (
          <ResultCard
            title={resultTitle(outcome.winners, settings)}
            detail={`Pieces left: ${names[0]} ${outcome.scores[0]}, ${names[1]} ${outcome.scores[1]}`}
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

      <PlayerRow
        name={vsBot ? names[0] : `${names[0]}, bottom`}
        stat={{ label: "Pieces", value: countPieces(board, 0) }}
        active={!playing && game.turn === 0}
      />

      <StatusLine notice={notice} status={status} />
    </main>
  );
}

function resultTitle(winners: Seat[], settings: DamaSettings): string {
  const [winner] = winners;
  if (winner === undefined) return "It's a draw";
  if (settings.mode === "bot") return winner === 0 ? "You win" : "You lose";
  return `${seatNames(settings.mode)[winner]} wins`;
}
