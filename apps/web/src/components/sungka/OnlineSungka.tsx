"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Seat } from "@laro/games";
import { legalMoves, result, storeOf, type SungkaEvent, type SungkaState } from "@laro/games/sungka";
import type { ClientMessage } from "@laro/rooms";
import { ShareLink } from "@/components/room/ShareLink";
import type { ConnectionStatus, RoomUpdate } from "@/lib/useRoom";
import { Board } from "./Board";
import { LeaveButton } from "./LeaveButton";
import { latestNotice, type Notice } from "./notices";
import { PlayerRow, PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON, StatusLine } from "./parts";
import { RulesButton } from "./Rules";
import { useSowing } from "./useSowing";

interface OnlineProps {
  update: RoomUpdate;
  status: ConnectionStatus;
  error: string | null;
  send: (message: ClientMessage) => boolean;
}

/** Sungka against someone on another phone. The server holds the real game, and this shows it. */
export function OnlineSungka(props: OnlineProps) {
  const { room } = props.update;
  if (room.phase === "waiting" || room.view === null) return <WaitingRoom code={room.code} status={props.status} />;
  // A new key for each game, so a rematch starts with a fresh board.
  return <OnlineGame key={room.round} {...props} />;
}

function WaitingRoom({ code, status }: { code: string; status: ConnectionStatus }) {
  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href="/sungka" className="text-sm text-muted hover:text-ink">
        ← Sungka
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Waiting for your friend</h1>
      <p className="mt-2 text-muted">
        Send this link to the person you want to play. The game starts as soon as they open it.
      </p>
      <ShareLink code={code} />
      <p className="mt-6 text-sm text-muted">
        Room code <b className="font-mono text-base tracking-widest text-ink">{code}</b>
        {status === "reconnecting" && " · Reconnecting..."}
      </p>
    </main>
  );
}

function OnlineGame({ update, status, error, send }: OnlineProps) {
  const { room, lastMove } = update;
  const view = room.view as SungkaState;
  const you = room.you;
  const { game, sowing, frame, events, board, show, restart } = useSowing(() => view, "normal");
  const router = useRouter();

  // When the server sends a new move, play it out if it follows the one on screen.
  // If moves were missed, for example after a reconnect, jump straight to the new board.
  const [shown, setShown] = useState(update);
  if (update !== shown) {
    setShown(update);
    if (room.moveCount !== shown.room.moveCount) {
      if (lastMove && lastMove.moveNumber === shown.room.moveCount + 1) {
        show(lastMove.seat, lastMove.events as SungkaEvent[], view);
      } else {
        restart(view);
      }
    }
  }

  // The move this player sent and is waiting to hear back about.
  const [sentAt, setSentAt] = useState<number | null>(null);
  const waitingForServer = sentAt === room.moveCount && error === null;

  const names: [string, string] = [room.seats[0]?.name ?? "Player 1", room.seats[1]?.name ?? "Player 2"];
  const bottom: Seat = you ?? 0;
  const top: Seat = bottom === 0 ? 1 : 0;
  const connected = room.seats.map((seat) => seat?.connected ?? false);
  const yourTurn = !sowing && you !== null && game.turn === you && status === "open" && !waitingForServer;
  const playable = yourTurn ? legalMoves(game, you) : [];
  const over = !sowing && game.turn === null;

  function playHouse(house: number) {
    if (yourTurn && send({ type: "move", move: house })) setSentAt(room.moveCount);
  }

  const playing = sowing?.seat ?? game.turn;
  let statusText: string;
  if (status === "reconnecting") statusText = "Connection lost. Reconnecting...";
  else if (playing === null) statusText = "Game over";
  else if (playing === you) statusText = sowing ? "Your move..." : "Your turn. Pick a house.";
  else if (!connected[playing]) statusText = `Waiting for ${names[playing]} to come back...`;
  else statusText = sowing ? `${names[playing]}'s move...` : `${names[playing]}'s turn`;

  const errorNotice: Notice | null = error ? { tone: "bad", text: error } : null;
  const notice = over ? null : (errorNotice ?? latestNotice(events, names, you));
  const label = (seat: Seat) => (seat === you ? `${names[seat]} (you)` : names[seat]);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-3 px-4 pb-8">
      <div className="flex items-center justify-between gap-2">
        <LeaveButton
          label="← Leave"
          ask={you !== null && room.phase === "playing"}
          title="Leave the room?"
          detail="Your seat stays yours. Open the room link again to come back to the game."
          leaveLabel="Leave"
          onLeave={() => router.push("/games")}
        />
        <span className="text-sm text-muted">
          {you === null ? "Watching" : "Room"} <b className="font-mono tracking-widest text-ink">{room.code}</b>
        </span>
        <RulesButton />
      </div>

      <PlayerRow
        name={label(top)}
        store={board[storeOf(top)]}
        active={!sowing && game.turn === top}
        note={connected[top] ? undefined : "offline"}
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
        />
        {over && <OnlineResult update={update} names={names} game={game} send={send} />}
      </div>

      <PlayerRow
        name={label(bottom)}
        store={board[storeOf(bottom)]}
        active={!sowing && game.turn === bottom}
        note={connected[bottom] ? undefined : "offline"}
      />

      <StatusLine notice={notice} status={statusText} />
    </main>
  );
}

function OnlineResult({
  update,
  names,
  game,
  send,
}: {
  update: RoomUpdate;
  names: [string, string];
  game: SungkaState;
  send: (message: ClientMessage) => boolean;
}) {
  const { room } = update;
  const you = room.you;
  const outcome = result(game);
  if (!outcome) return null;

  const [winner] = outcome.winners;
  let title: string;
  if (winner === undefined) title = "It's a tie";
  else if (you === null) title = `${names[winner]} wins`;
  else title = winner === you ? "You win" : "You lose";

  const other = you === null ? null : you === 0 ? 1 : 0;
  const youAsked = you !== null && room.rematch.includes(you);
  const theyAsked = other !== null && room.rematch.includes(other);

  return (
    <ResultCard title={title} detail={`${names[0]} ${outcome.scores[0]}, ${names[1]} ${outcome.scores[1]}`}>
      {other !== null && (
        <>
          {theyAsked && !youAsked && <p className="-mt-2 mb-1 text-sm text-muted">{names[other]} wants to play again.</p>}
          <button
            type="button"
            onClick={() => send({ type: "rematch" })}
            disabled={youAsked}
            className={PRIMARY_BUTTON}
            autoFocus
          >
            {youAsked ? `Waiting for ${names[other]}...` : "Play again"}
          </button>
        </>
      )}
      <Link href="/games" className={SECONDARY_BUTTON}>
        Leave
      </Link>
    </ResultCard>
  );
}
