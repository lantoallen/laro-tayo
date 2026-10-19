"use client";

import type { Seat } from "@laro/games";
import { countPieces, fullMoves, legalMoves, result, type DamaEvent, type DamaState } from "@laro/games/dama";
import { PlayerRow, StatusLine, type Notice } from "@/components/game/parts";
import {
  RoomBar,
  RoomResult,
  roomNames,
  usePendingMove,
  useRoomMoves,
  useTurnTitle,
  WaitingRoom,
  type OnlineProps,
} from "@/components/room/online";
import { DamaBoard } from "./DamaBoard";
import { Rules } from "./Rules";
import { latestNotice } from "./notices";
import { useDamaPlayback } from "./useDamaPlayback";
import { useMoveSelection } from "./useMoveSelection";

/** Dama against someone on another phone. The server holds the real game, and this shows it. */
export function OnlineDama(props: OnlineProps) {
  const { room } = props.update;
  if (room.phase === "waiting" || room.view === null) {
    return <WaitingRoom code={room.code} status={props.status} gameName="Dama" gameHref="/dama" />;
  }
  // A new key for each game, so a rematch starts with a fresh board.
  return <OnlineGame key={room.round} {...props} />;
}

function OnlineGame({ update, status, error, send }: OnlineProps) {
  const { room } = update;
  const you = room.you;
  const { game, playing, frame, board, last, events, mover, show, restart } = useDamaPlayback(
    () => room.view as DamaState,
    "normal",
  );
  useRoomMoves<DamaState, DamaEvent>(update, show, restart);
  const pending = usePendingMove(room.moveCount, error);

  const names = roomNames(room);
  // Each player sees their own pieces at the bottom. Someone watching sees red at the bottom.
  const bottom: Seat = you ?? 0;
  const top: Seat = bottom === 0 ? 1 : 0;
  const connected = room.seats.map((seat) => seat?.connected ?? false);
  const yourMove = !playing && you !== null && game.turn === you;
  const yourTurn = yourMove && status === "open" && !pending.waiting;
  const moves = yourTurn ? legalMoves(game, you) : [];
  const mustCapture = yourTurn && fullMoves(game.board, you).some((move) => move.captured.length > 0);
  const { selection, movable, targets, tap } = useMoveSelection(moves);
  const over = !playing && game.turn === null;
  const outcome = over ? result(game) : null;
  useTurnTitle(yourMove);

  function tapSquare(square: number) {
    const complete = tap(square);
    if (complete && send({ type: "move", move: complete })) pending.markSent();
  }

  const turn = playing ? mover : game.turn;
  let statusText: string;
  if (status === "reconnecting") statusText = "Connection lost. Reconnecting...";
  else if (turn === null) statusText = "Game over";
  else if (turn === you && playing) statusText = "Your move...";
  else if (turn === you && pending.waiting) statusText = "Sending your move...";
  else if (turn === you && selection.length > 1) statusText = "Keep jumping. Tap the next square.";
  else if (turn === you && selection.length === 1) statusText = mustCapture ? "Tap where to jump." : "Tap where to move it.";
  else if (turn === you) statusText = mustCapture ? "Your turn. You have to capture." : "Your turn. Pick a piece.";
  else if (!connected[turn]) statusText = `Waiting for ${names[turn]} to come back...`;
  else statusText = playing ? `${names[turn]}'s move...` : `${names[turn]}'s turn`;

  const errorNotice: Notice | null = error ? { tone: "bad", text: error } : null;
  const notice = over || selection.length > 0 ? null : (errorNotice ?? latestNotice(events, mover, names, you));
  const label = (seat: Seat) => {
    const color = seat === 0 ? "red" : "blue";
    return seat === you ? `${names[seat]} (you, ${color})` : `${names[seat]} (${color})`;
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <RoomBar room={room} rules={<Rules />} />

      <PlayerRow
        name={label(top)}
        stat={{ label: "Pieces", value: countPieces(board, top) }}
        active={!playing && game.turn === top}
        note={connected[top] ? undefined : "offline"}
      />

      <div className="relative mx-auto w-full max-w-[32rem]">
        <DamaBoard
          board={board}
          perspective={bottom}
          movable={movable}
          targets={targets}
          path={selection}
          captured={frame?.captured}
          last={last}
          onTap={yourTurn ? tapSquare : undefined}
        />
        {outcome && (
          <RoomResult
            room={room}
            outcome={outcome}
            names={names}
            detail={`Pieces left: ${names[0]} ${outcome.scores[0]}, ${names[1]} ${outcome.scores[1]}`}
            tieTitle="It's a draw"
            send={send}
          />
        )}
      </div>

      <PlayerRow
        name={label(bottom)}
        stat={{ label: "Pieces", value: countPieces(board, bottom) }}
        active={!playing && game.turn === bottom}
        note={connected[bottom] ? undefined : "offline"}
      />

      <StatusLine notice={notice} status={statusText} />
    </main>
  );
}
