"use client";

import { useEffect, useState } from "react";
import { moversOf, type Seat } from "@laro/games";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RoundClock } from "@/components/game/RoundClock";
import { RulesButton } from "@/components/game/RulesButton";
import { SoundButton } from "@/components/game/SoundButton";
import { PlayerRow, PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "@/components/game/parts";
import { resultTitle } from "@/components/game/results";
import { LEVEL_LABELS, YOU, botName, type BoardGameSettings } from "@/components/game/settings";
import { useRecordResult } from "@/lib/record";
import { useResultSound } from "@/lib/sound";
import { colorWord, promptFor, type BoardGameConfig } from "./types";
import { useMoveSound } from "./useMoveSound";

/** How long the bot waits before playing, so its move doesn't appear the instant yours lands. */
const BOT_DELAY_MS = 600;

/** A game on this phone: you against bots, or players passing the phone around. */
export function LocalBoardGame<State, Move>({
  config,
  settings,
  firstSeat,
  onRematch,
  onExit,
}: {
  config: BoardGameConfig<State, Move>;
  settings: BoardGameSettings;
  firstSeat: Seat;
  onRematch: () => void;
  onExit: () => void;
}) {
  const { game, Board, Rules } = config;
  const players = Math.min(game.maxSeats, Math.max(game.minSeats, settings.players));
  const [state, setState] = useState(() => game.setup({ seats: players, firstSeat }));
  const [moves, setMoves] = useState(0);
  const vsBot = settings.mode === "bot";
  const seats = Array.from({ length: players }, (_, seat) => seat);
  const names = seats.map((seat) => (!vsBot ? config.colors[seat] : seat === YOU ? "You" : botName(seat, players)));
  // In a bot game the player at the bottom is "you". In pass and play nobody is.
  const you: Seat | null = vsBot ? YOU : null;
  const turn = game.turn(state);
  // Usually just whoever's turn it is. In a game where everyone picks at once, everyone still to pick.
  const movers = moversOf(game, state);
  const botSeat = vsBot ? (movers.find((seat) => seat !== YOU) ?? null) : null;
  const botToMove = botSeat !== null;
  const humanSeat = vsBot ? (movers.includes(YOU) ? YOU : null) : (movers[0] ?? null);
  const outcome = game.result(state);
  useMoveSound(config, state, moves, you);
  useResultSound(outcome?.winners ?? null, you);
  // Games against a bot count toward this phone's record. Pass and play doesn't.
  const opponent = !vsBot ? null : config.botLevels === false ? "bot" : settings.level;
  useRecordResult(game.id, opponent, outcome?.winners ?? null, you);

  const { botDelayMs = BOT_DELAY_MS } = config;
  const botDelay = typeof botDelayMs === "number" ? botDelayMs : botDelayMs(state);
  useEffect(() => {
    if (botSeat === null) return;
    const timer = setTimeout(() => {
      const move = game.bot!(state, botSeat, { level: settings.level, rng: Math.random });
      setState(game.play(state, botSeat, move).state);
      setMoves((count) => count + 1);
    }, botDelay);
    return () => clearTimeout(timer);
  }, [botDelay, botSeat, game, state, settings.level]);

  function move(next: Move) {
    if (humanSeat === null) return;
    setState(game.play(state, humanSeat, next).state);
    setMoves(moves + 1);
  }

  // In a game against the clock, time running out plays for you.
  const clock = game.timer && vsBot && humanSeat !== null ? game.timer : null;
  function timeUp() {
    if (!clock) return;
    setState(clock.timeOut(state, Math.random).state);
    setMoves(moves + 1);
  }

  let turnLabel: string | null;
  if (game.movers) turnLabel = humanSeat !== null && vsBot ? "Your turn" : null;
  else turnLabel = turn === null ? null : turn === you ? "Your turn" : `${names[turn]}'s turn`;
  const badgeSeat = game.movers ? YOU : turn;
  let status: string;
  if (outcome) status = "Game over";
  else if (botToMove && humanSeat === null) status = config.othersTurn?.(state, names[botSeat]) ?? "Thinking...";
  else status = promptFor(config, state);
  // In a game against one bot, the messages say "the bot".
  const noticeNames = vsBot && players === 2 ? ["You", "The bot"] : names;
  const notice = outcome ? null : (config.notice?.(state, noticeNames, you) ?? null);

  const row = (seat: Seat) => {
    const color = colorWord(config.colors[seat]);
    let name = names[seat];
    if (vsBot && seat !== YOU) {
      name = config.botLevels === false ? `${name}, ${color}` : `${name} (${LEVEL_LABELS[settings.level]}), ${color}`;
    } else if (vsBot) {
      name = `You, ${color}`;
    }
    return (
      <PlayerRow
        key={seat}
        name={name}
        color={config.swatches[seat]}
        stat={{ label: config.stat.label, value: config.stat.value(state, seat) }}
        active={movers.includes(seat)}
        note={config.seatNote?.(state, seat) ?? undefined}
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

      {/* Everyone else above the board, in the order they play. You below it. */}
      <div className="flex flex-col gap-1.5">{seats.filter((seat) => seat !== YOU).map(row)}</div>
      <div className="mx-auto w-full max-w-[32rem]">
        <Board state={state} you={you} onMove={humanSeat === null ? undefined : move} />
      </div>
      {row(YOU)}

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
        <>
          {clock && <RoundClock key={clock.round(state)} ms={clock.ms} onTimeUp={timeUp} />}
          <StatusLine
            notice={notice}
            status={status}
            turn={turnLabel === null ? null : { label: turnLabel, color: config.swatches[badgeSeat!] }}
          />
        </>
      )}
    </main>
  );
}
