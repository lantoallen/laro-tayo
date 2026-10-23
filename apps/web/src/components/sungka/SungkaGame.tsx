"use client";

import { useEffect, useState } from "react";
import type { Seat } from "@laro/games";
import { chooseMove, legalMoves, result, setup, storeOf } from "@laro/games/sungka";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { SoundButton } from "@/components/game/SoundButton";
import { PlayerRow, PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "@/components/game/parts";
import { SEAT_COLORS } from "@/components/game/settings";
import { useRecordResult } from "@/lib/record";
import { useResultSound } from "@/lib/sound";
import { Board } from "./Board";
import { Rules } from "./Rules";
import { latestNotice } from "./notices";
import { LEVEL_LABELS, seatNames, type SungkaSettings } from "./settings";
import { DELAYS, useSowing, type Speed } from "./useSowing";

const BOT_SEAT: Seat = 1;
/** Sungka has no piece colors, so each side gets one for its row and turn badge. */
const SEAT_COLOR = [SEAT_COLORS.blue, SEAT_COLORS.red];

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
  useResultSound(outcome?.winners ?? null, vsBot ? 0 : null);
  useRecordResult("sungka", vsBot ? settings.level : null, outcome?.winners ?? null, 0);

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
  // Whoever is sowing now, or moves next.
  const playing = sowing?.seat ?? game.turn;
  const turnLabel =
    playing === null ? null : vsBot ? (playing === BOT_SEAT ? "Bot's turn" : "Your turn") : `${names[playing]}'s turn`;
  let status: string;
  if (playing === null) status = "Game over";
  else if (sowing) status = "Sowing...";
  else if (vsBot && playing === BOT_SEAT) status = "Thinking...";
  else if (vsBot) status = "Pick a house on your side.";
  else status = `Pick a house on the ${playing === 0 ? "bottom" : "top"} row.`;

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
          <SoundButton />
          <RulesButton firstVisit="sungka">
            <Rules />
          </RulesButton>
        </div>
      </div>

      <PlayerRow
        name={vsBot ? `Bot (${LEVEL_LABELS[settings.level]})` : names[1]}
        stat={{ label: "Store", value: board[storeOf(1)] }}
        active={playing === 1}
        color={SEAT_COLOR[1]}
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
            celebrate={outcome.winners.length === 1 && (!vsBot || outcome.winners[0] === 0)}
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

      <PlayerRow
        name={names[0]}
        stat={{ label: "Store", value: board[storeOf(0)] }}
        active={playing === 0}
        color={SEAT_COLOR[0]}
      />

      <StatusLine
        notice={shownNotice}
        status={status}
        turn={turnLabel === null ? null : { label: turnLabel, color: SEAT_COLOR[playing!] }}
      />
    </main>
  );
}

function resultTitle(winners: Seat[], settings: SungkaSettings): string {
  const [winner] = winners;
  if (winner === undefined) return "It's a tie";
  if (settings.mode === "bot") return winner === 0 ? "You win" : "You lose";
  return `${seatNames(settings.mode)[winner]} wins`;
}
