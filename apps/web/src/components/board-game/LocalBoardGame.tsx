"use client";

import { useEffect, useState } from "react";
import type { Seat } from "@laro/games";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { SoundButton } from "@/components/game/SoundButton";
import { PlayerRow, PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "@/components/game/parts";
import { BOT_SEAT, LEVEL_LABELS, type TwoPlayerSettings } from "@/components/game/settings";
import { useResultSound } from "@/lib/sound";
import { promptFor, resultTitle, type BoardGameConfig } from "./types";
import { useMoveSound } from "./useMoveSound";

/** How long the bot waits before playing, so its move doesn't appear the instant yours lands. */
const BOT_DELAY_MS = 600;

/** A two-player game on this phone, against the bot or passed back and forth. */
export function LocalBoardGame<State, Move>({
  config,
  settings,
  firstSeat,
  onRematch,
  onExit,
}: {
  config: BoardGameConfig<State, Move>;
  settings: TwoPlayerSettings;
  firstSeat: Seat;
  onRematch: () => void;
  onExit: () => void;
}) {
  const { game, Board, Rules } = config;
  const [state, setState] = useState(() => game.setup({ seats: 2, firstSeat }));
  const [moves, setMoves] = useState(0);
  const vsBot = settings.mode === "bot";
  const names: readonly [string, string] = vsBot ? ["You", "Bot"] : config.colors;
  // In a bot game the player at the bottom is "you". In pass and play nobody is.
  const you: Seat | null = vsBot ? 0 : null;
  const turn = game.turn(state);
  const botToMove = vsBot && turn === BOT_SEAT;
  const humanSeat = turn !== null && !botToMove ? turn : null;
  const outcome = game.result(state);
  useMoveSound(config, state, moves);
  useResultSound(outcome?.winners ?? null, you);

  useEffect(() => {
    if (!botToMove) return;
    const timer = setTimeout(() => {
      const move = game.bot!(state, BOT_SEAT, { level: settings.level, rng: Math.random });
      setState(game.play(state, BOT_SEAT, move).state);
      setMoves((count) => count + 1);
    }, config.botDelayMs ?? BOT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [botToMove, config.botDelayMs, game, state, settings.level]);

  function move(next: Move) {
    if (humanSeat === null) return;
    setState(game.play(state, humanSeat, next).state);
    setMoves(moves + 1);
  }

  const turnLabel =
    turn === null ? null : vsBot ? (turn === BOT_SEAT ? "Bot's turn" : "Your turn") : `${config.colors[turn]}'s turn`;
  let status: string;
  if (outcome) status = "Game over";
  else if (botToMove) status = "Thinking...";
  else status = promptFor(config, state);
  // In a bot game the messages talk to the player at the bottom. In pass and play they use names.
  const notice = outcome ? null : (config.notice?.(state, vsBot ? ["You", "The bot"] : names, you) ?? null);

  const row = (seat: Seat) => {
    const color = config.colors[seat].toLowerCase();
    const name = !vsBot
      ? config.colors[seat]
      : seat === BOT_SEAT
        ? `Bot (${LEVEL_LABELS[settings.level]}), ${color}`
        : `You, ${color}`;
    return (
      <PlayerRow
        name={name}
        color={config.swatches[seat]}
        stat={{ label: config.stat.label, value: config.stat.value(state, seat) }}
        active={turn === seat}
      />
    );
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <LeaveButton
          label="← Back"
          ask={moves > 0 && !outcome}
          title="Leave this game?"
          detail="The game ends and the board isn't saved."
          leaveLabel="Leave game"
          onLeave={onExit}
        />
        <div className="flex items-center gap-2">
          <SoundButton />
          <RulesButton firstVisit={game.id}>
            <Rules />
          </RulesButton>
        </div>
      </div>

      {row(1)}
      <div className="mx-auto w-full max-w-[32rem]">
        <Board state={state} you={you} onMove={humanSeat === null ? undefined : move} />
      </div>
      {row(0)}

      {outcome ? (
        <ResultCard
          inline
          celebrate={outcome.winners.length > 0 && (you === null || outcome.winners.includes(you))}
          title={resultTitle(outcome.winners, names, you)}
          detail={config.resultDetail(state, names)}
        >
          <button type="button" onClick={onRematch} className={PRIMARY_BUTTON} autoFocus>
            Play again
          </button>
          <button type="button" onClick={onExit} className={SECONDARY_BUTTON}>
            Change settings
          </button>
        </ResultCard>
      ) : (
        <StatusLine
          notice={notice}
          status={status}
          turn={turnLabel === null ? null : { label: turnLabel, color: config.swatches[turn!] }}
        />
      )}
    </main>
  );
}
