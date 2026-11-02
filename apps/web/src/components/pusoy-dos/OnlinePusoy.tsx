"use client";

import { useEffect, useRef } from "react";
import type { Seat } from "@laro/games";
import { result, type PusoyEvent, type PusoyMove, type PusoyView } from "@laro/games/pusoy-dos";
import type { Notice } from "@/components/game/parts";
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
import { playSound, useResultSound } from "@/lib/sound";
import { PusoyTable } from "./PusoyTable";
import { Rules } from "./Rules";

/** Pusoy Dos with friends on other phones. The server deals and holds every hand, and sends each player only theirs. */
export function OnlinePusoy(props: OnlineProps) {
  const { room } = props.update;
  if (room.phase === "waiting" || room.view === null) {
    return (
      <WaitingRoom code={room.code} status={props.status} gameName="Pusoy Dos" gameHref="/pusoy-dos" room={room} />
    );
  }
  // A new key for each game, so a rematch starts with nothing picked.
  return <OnlineTable key={room.round} {...props} />;
}

function OnlineTable({ update, status, error, send }: OnlineProps) {
  const { room, lastMove } = update;
  const view = room.view as PusoyView;
  const you = room.you;
  const names = seatNames(room);
  const pending = usePendingMove(room.moveCount, error);
  // Which move the last play was sent for, set straight away, so a quick double tap can't send two.
  const sentFor = useRef<number | null>(null);
  const yourMove = you !== null && view.turn === you;
  const canMove = yourMove && status === "open" && !pending.waiting;
  const outcome = result(view);
  useTurnTitle(yourMove);
  useResultSound(outcome?.winners ?? null, you);
  useRecordResult("pusoy-dos", "online", outcome?.winners ?? null, you, `${room.code}:${room.round}`);

  // The sound of each play or pass as it arrives, but not of the moves made before this page opened.
  const heard = useRef(room.moveCount);
  useEffect(() => {
    if (room.moveCount === heard.current) return;
    heard.current = room.moveCount;
    if (lastMove?.moveNumber === room.moveCount) {
      const played = (lastMove.events as PusoyEvent[]).some((event) => event.type === "play");
      playSound(played ? "flip" : "tap");
    }
  }, [room.moveCount, lastMove]);

  function move(next: PusoyMove) {
    if (sentFor.current === room.moveCount && error === null) return;
    if (!send({ type: "move", move: next })) return;
    sentFor.current = room.moveCount;
    pending.markSent();
  }

  const events = lastMove?.moveNumber === room.moveCount ? (lastMove.events as PusoyEvent[]) : [];
  let statusText: string | null = null;
  if (status === "reconnecting") statusText = "Connection lost. Reconnecting...";
  else if (yourMove && pending.waiting) statusText = "Sending your move...";
  const turn: Seat | null = view.turn;
  const waiting = turn === null ? "" : (waitingOn(room, turn, names) ?? "Waiting for their play...");
  const errorNotice: Notice | null = error ? { tone: "bad", text: error } : null;

  return (
    <PusoyTable
      view={view}
      you={you}
      names={names}
      canMove={canMove}
      onMove={move}
      events={events}
      waiting={waiting}
      status={statusText}
      notice={errorNotice ?? timedOutNotice(update)}
      seatNote={(seat) => onlineNote(room, seat)}
      topBar={<RoomBar room={room} rules={<Rules />} />}
      below={<TurnClock room={room} send={send} />}
      result={
        outcome && (
          <RoomResult
            room={room}
            outcome={outcome}
            names={names}
            detail={`Cards left: ${names
              .flatMap((name, seat) => (seat === outcome.winners[0] ? [] : [`${name} ${outcome.scores[seat]}`]))
              .join(", ")}`}
            tieTitle="It's a draw"
            send={send}
          />
        )
      }
    />
  );
}
