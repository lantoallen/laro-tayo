"use client";

import { useRef, useState } from "react";
import { moversOf, type Seat } from "@laro/games";
import { PlayerRow, StatusLine, type Notice } from "@/components/game/parts";
import { RoundClock } from "@/components/game/RoundClock";
import {
  onlineNote,
  RoomBar,
  RoomResult,
  seatNames,
  timedOutNotice,
  usePendingMove,
  useTurnTitle,
  WaitingRoom,
  waitingOn,
  type OnlineProps,
} from "@/components/room/online";
import { TurnClock } from "@/components/room/TurnClock";
import { useRecordResult } from "@/lib/record";
import { useResultSound } from "@/lib/sound";
import { colorWord, promptFor, type BoardGameConfig } from "./types";
import { useMoveSound } from "./useMoveSound";

type Props<State, Move> = OnlineProps & { config: BoardGameConfig<State, Move> };

/** A game against friends on other phones. The server holds the real game, and this shows it. */
export function OnlineBoardGame<State, Move>(props: Props<State, Move>) {
  const { room } = props.update;
  if (room.phase === "waiting" || room.view === null) {
    return (
      <WaitingRoom
        code={room.code}
        status={props.status}
        gameName={props.config.game.name}
        gameHref={props.config.href}
        room={room}
      />
    );
  }
  return <OnlineTable {...props} />;
}

function OnlineTable<State, Move>({ config, update, status, error, send }: Props<State, Move>) {
  const { game, Board, Rules } = config;
  const { room } = update;
  const state = room.view as State;
  const you = room.you;
  const pending = usePendingMove(room.moveCount, error);
  const names = seatNames(room);
  const players = names.length;
  // Each player sees themselves at the bottom, and everyone else above in the order they play.
  // Someone watching sees seat 0 at the bottom.
  const bottom: Seat = you ?? 0;
  const above = Array.from({ length: players - 1 }, (_, i) => (bottom + 1 + i) % players);
  const connected = room.seats.map((seat) => seat?.connected ?? false);
  const turn = game.turn(state);
  const outcome = game.result(state);
  // Usually just whoever's turn it is. In a game where everyone picks at once, everyone still to pick.
  const movers = moversOf(game, state);
  // When everyone moves at once, someone else's move can arrive before yours lands and still show you
  // as picking. So once you've moved, wait for the next round, unless the server turned your move down.
  const roundKey = game.movers && game.timer ? `${room.round}-${game.timer.round(state)}` : null;
  const [movedIn, setMovedIn] = useState<string | null>(null);
  // What the last move was sent for, set straight away, so a quick double tap can't send two before the screen updates.
  const sentFor = useRef<string | number | null>(null);
  const movedThisRound = roundKey !== null && movedIn === roundKey && error === null;
  const yourMove = you !== null && movers.includes(you) && !movedThisRound;
  const yourTurn = yourMove && status === "open" && !pending.waiting;
  useTurnTitle(yourMove);
  useMoveSound(config, state, room.moveCount, you);
  useResultSound(outcome?.winners ?? null, you);
  useRecordResult(game.id, "online", outcome?.winners ?? null, you, `${room.code}:${room.round}`);

  function move(next: Move) {
    const key = roundKey ?? room.moveCount;
    if (sentFor.current === key && error === null) return;
    if (!send({ type: "move", move: next })) return;
    sentFor.current = key;
    pending.markSent();
    setMovedIn(roundKey);
  }

  let turnLabel: string | null;
  if (game.movers) turnLabel = yourMove ? "Your turn" : null;
  else turnLabel = turn === null ? null : turn === you ? "Your turn" : `${names[turn]}'s turn`;
  const badgeSeat = game.movers ? you : turn;
  let statusText: string;
  if (status === "reconnecting") statusText = "Connection lost. Reconnecting...";
  else if (turn === null) statusText = "Game over";
  else if (yourMove && pending.waiting) statusText = "Sending your move...";
  else if (yourMove) statusText = promptFor(config, state);
  else if (game.movers && movers.some((seat) => !connected[seat])) {
    statusText = "Waiting for the others. Anyone who doesn't pick in time steps at random.";
  } else {
    statusText =
      waitingOn(room, turn, names) ?? config.othersTurn?.(state, names[turn]) ?? "Waiting for their move...";
  }

  const errorNotice: Notice | null = error ? { tone: "bad", text: error } : null;
  const notice = errorNotice ?? timedOutNotice(update) ?? config.notice?.(state, names, you) ?? null;

  const row = (seat: Seat) => {
    const color = colorWord(config.colors[seat]);
    return (
      <PlayerRow
        key={seat}
        name={seat === you ? `${names[seat]} (you, ${color})` : `${names[seat]} (${color})`}
        color={config.swatches[seat]}
        stat={{ label: config.stat.label, value: config.stat.value(state, seat) }}
        active={movers.includes(seat)}
        note={config.seatNote?.(state, seat) ?? onlineNote(room, seat)}
      />
    );
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <RoomBar room={room} rules={<Rules />} />
      <div className="flex flex-col gap-1.5">{above.map(row)}</div>
      <div className="mx-auto w-full max-w-[32rem]">
        <Board state={state} you={you} onMove={yourTurn ? move : undefined} />
      </div>
      {row(bottom)}
      {outcome ? (
        <RoomResult
          inline
          room={room}
          outcome={outcome}
          names={names}
          detail={config.resultDetail(state, names)}
          tieTitle="It's a draw"
          send={send}
        />
      ) : (
        <>
          {game.timer ? (
            yourMove &&
            room.timeLeftMs !== null && (
              // The server plays for you when time runs out, so the clock here only shows how long is left.
              <RoundClock key={`${room.round}-${game.timer.round(state)}`} ms={room.timeLeftMs} />
            )
          ) : (
            <TurnClock room={room} send={send} />
          )}
          <StatusLine
            notice={notice}
            status={statusText}
            turn={turnLabel === null ? null : { label: turnLabel, color: config.swatches[badgeSeat!] }}
          />
        </>
      )}
    </main>
  );
}
