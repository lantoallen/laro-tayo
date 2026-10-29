"use client";

import type { Seat } from "@laro/games";
import { PlayerRow, StatusLine, type Notice } from "@/components/game/parts";
import {
  RoomBar,
  RoomResult,
  seatNames,
  usePendingMove,
  useTurnTitle,
  WaitingRoom,
  type OnlineProps,
} from "@/components/room/online";
import { useRecordResult } from "@/lib/record";
import { useResultSound } from "@/lib/sound";
import { promptFor, type BoardGameConfig } from "./types";
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
  const yourMove = you !== null && turn === you;
  const yourTurn = yourMove && status === "open" && !pending.waiting;
  useTurnTitle(yourMove);
  useMoveSound(config, state, room.moveCount, you);
  useResultSound(outcome?.winners ?? null, you);
  useRecordResult(game.id, "online", outcome?.winners ?? null, you, `${room.code}:${room.round}`);

  function move(next: Move) {
    if (send({ type: "move", move: next })) pending.markSent();
  }

  const turnLabel = turn === null ? null : turn === you ? "Your turn" : `${names[turn]}'s turn`;
  let statusText: string;
  if (status === "reconnecting") statusText = "Connection lost. Reconnecting...";
  else if (turn === null) statusText = "Game over";
  else if (turn === you && pending.waiting) statusText = "Sending your move...";
  else if (turn === you) statusText = promptFor(config, state);
  else if (!connected[turn]) statusText = `Waiting for ${names[turn]} to come back...`;
  else statusText = config.othersTurn?.(state, names[turn]) ?? "Waiting for their move...";

  const errorNotice: Notice | null = error ? { tone: "bad", text: error } : null;
  const notice = errorNotice ?? config.notice?.(state, names, you) ?? null;

  const row = (seat: Seat) => {
    const color = config.colors[seat].toLowerCase();
    return (
      <PlayerRow
        key={seat}
        name={seat === you ? `${names[seat]} (you, ${color})` : `${names[seat]} (${color})`}
        color={config.swatches[seat]}
        stat={{ label: config.stat.label, value: config.stat.value(state, seat) }}
        active={turn === seat}
        note={config.seatNote?.(state, seat) ?? (connected[seat] ? undefined : "offline")}
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
        <StatusLine
          notice={notice}
          status={statusText}
          turn={turnLabel === null ? null : { label: turnLabel, color: config.swatches[turn!] }}
        />
      )}
    </main>
  );
}
