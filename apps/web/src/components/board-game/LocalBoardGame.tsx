"use client";

import { useEffect, useState } from "react";
import type { Seat } from "@laro/games";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { PlayerRow, PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "@/components/game/parts";
import { BOT_SEAT, LEVEL_LABELS, type TwoPlayerSettings } from "@/components/game/settings";
import { promptFor, resultTitle, type BoardGameConfig } from "./types";

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
  const turn = game.turn(state);
  const botToMove = vsBot && turn === BOT_SEAT;
  const humanSeat = turn !== null && !botToMove ? turn : null;
  const outcome = game.result(state);

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

  let status: string;
  if (outcome) status = "Game over";
  else if (botToMove) status = "Bot's turn...";
  else status = `${vsBot ? "Your" : `${names[turn!]}'s`} turn. ${promptFor(config, state)}`;
  // In a bot game the messages talk to the player at the bottom. In pass and play they use names.
  const notice = outcome
    ? null
    : (config.notice?.(state, vsBot ? ["You", "The bot"] : names, vsBot ? 0 : null) ?? null);

  const rowName = (seat: Seat) => {
    const color = config.colors[seat].toLowerCase();
    if (!vsBot) return config.colors[seat];
    return seat === BOT_SEAT ? `Bot (${LEVEL_LABELS[settings.level]}), ${color}` : `You, ${color}`;
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
        <RulesButton>
          <Rules />
        </RulesButton>
      </div>

      <PlayerRow
        name={rowName(1)}
        stat={{ label: config.stat.label, value: config.stat.value(state, 1) }}
        active={turn === 1}
      />
      <div className="mx-auto w-full max-w-[32rem]">
        <Board state={state} you={vsBot ? 0 : null} onMove={humanSeat === null ? undefined : move} />
      </div>
      <PlayerRow
        name={rowName(0)}
        stat={{ label: config.stat.label, value: config.stat.value(state, 0) }}
        active={turn === 0}
      />

      {outcome ? (
        <ResultCard
          inline
          title={resultTitle(outcome.winners, names, vsBot ? 0 : null)}
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
        <StatusLine notice={notice} status={status} />
      )}
    </main>
  );
}
