"use client";

import type { Seat } from "@laro/games";
import { legalMoves, result, storeOf, type SungkaEvent, type SungkaState } from "@laro/games/sungka";
import { PlayerRow, StatusLine, type Notice } from "@/components/game/parts";
import { SEAT_COLORS } from "@/components/game/settings";
import {
  onlineNote,
  RoomBar,
  RoomResult,
  roomNames,
  usePendingMove,
  useRoomMoves,
  timedOutNotice,
  useTurnTitle,
  WaitingRoom,
  waitingOn,
  type OnlineProps,
} from "@/components/room/online";
import { TurnClock } from "@/components/room/TurnClock";
import { useRecordResult } from "@/lib/record";
import { useResultSound } from "@/lib/sound";
import { Board } from "./Board";
import { Rules } from "./Rules";
import { latestNotice } from "./notices";
import { useSowing } from "./useSowing";

/** Sungka has no piece colors, so each side gets one for its row and turn badge. */
const SEAT_COLOR = [SEAT_COLORS.blue, SEAT_COLORS.red];

/** Sungka against someone on another phone. The server holds the real game, and this shows it. */
export function OnlineSungka(props: OnlineProps) {
  const { room } = props.update;
  if (room.phase === "waiting" || room.view === null) {
    return <WaitingRoom code={room.code} status={props.status} gameName="Sungka" gameHref="/sungka" />;
  }
  // A new key for each game, so a rematch starts with a fresh board.
  return <OnlineGame key={room.round} {...props} />;
}

function OnlineGame({ update, status, error, send }: OnlineProps) {
  const { room } = update;
  const you = room.you;
  const { game, sowing, frame, events, board, show, restart, finish } = useSowing(
    () => room.view as SungkaState,
    "normal",
  );
  useRoomMoves<SungkaState, SungkaEvent>(update, show, restart);
  const pending = usePendingMove(room.moveCount, error);

  const names = roomNames(room);
  const bottom: Seat = you ?? 0;
  const top: Seat = bottom === 0 ? 1 : 0;
  const yourMove = !sowing && you !== null && game.turn === you;
  const yourTurn = yourMove && status === "open" && !pending.waiting;
  const playable = yourTurn ? legalMoves(game, you) : [];
  const over = !sowing && game.turn === null;
  const outcome = over ? result(game) : null;
  useTurnTitle(yourMove);
  useResultSound(outcome?.winners ?? null, you);
  useRecordResult("sungka", "online", outcome?.winners ?? null, you, `${room.code}:${room.round}`);

  function playHouse(house: number) {
    if (yourTurn && send({ type: "move", move: house })) pending.markSent();
  }

  const playing = sowing?.seat ?? game.turn;
  const turnLabel = playing === null ? null : playing === you ? "Your turn" : `${names[playing]}'s turn`;
  let statusText: string;
  if (status === "reconnecting") statusText = "Connection lost. Reconnecting...";
  else if (playing === null) statusText = "Game over";
  else if (sowing) statusText = "Sowing... Tap the board to skip ahead.";
  else if (playing === you) statusText = "Pick a house on your side.";
  else statusText = waitingOn(room, playing, names) ?? "Waiting for their move...";

  const errorNotice: Notice | null = error ? { tone: "bad", text: error } : null;
  const notice = over ? null : (errorNotice ?? timedOutNotice(update) ?? latestNotice(events, names, you));
  const label = (seat: Seat) => (seat === you ? `${names[seat]} (you)` : names[seat]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <RoomBar room={room} rules={<Rules />} />

      <PlayerRow
        name={label(top)}
        stat={{ label: "Store", value: board[storeOf(top)] }}
        active={playing === top}
        color={SEAT_COLOR[top]}
        note={onlineNote(room, top)}
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
          perspective={bottom}
          onSkip={sowing ? finish : undefined}
        />
        {outcome && (
          <RoomResult
            room={room}
            outcome={outcome}
            names={names}
            detail={`${names[0]} ${outcome.scores[0]}, ${names[1]} ${outcome.scores[1]}`}
            tieTitle="It's a tie"
            send={send}
          />
        )}
      </div>

      <PlayerRow
        name={label(bottom)}
        stat={{ label: "Store", value: board[storeOf(bottom)] }}
        active={playing === bottom}
        color={SEAT_COLOR[bottom]}
        note={onlineNote(room, bottom)}
      />

      <TurnClock room={room} send={send} />
      <StatusLine
        notice={notice}
        status={statusText}
        turn={turnLabel === null ? null : { label: turnLabel, color: SEAT_COLOR[playing!] }}
      />
    </main>
  );
}
