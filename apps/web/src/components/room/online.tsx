"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { GameResult, Seat } from "@laro/games";
import type { ClientMessage, RoomSnapshot } from "@laro/rooms";
import { LeaveButton } from "@/components/game/LeaveButton";
import { RulesButton } from "@/components/game/RulesButton";
import { PRIMARY_BUTTON, ResultCard, SECONDARY_BUTTON } from "@/components/game/parts";
import type { ConnectionStatus, RoomUpdate } from "@/lib/useRoom";
import { ShareLink } from "./ShareLink";

/** What every online game screen gets from the room page. */
export interface OnlineProps {
  update: RoomUpdate;
  status: ConnectionStatus;
  error: string | null;
  send: (message: ClientMessage) => boolean;
}

export function roomNames(room: RoomSnapshot): [string, string] {
  return [room.seats[0]?.name ?? "Player 1", room.seats[1]?.name ?? "Player 2"];
}

/** Shown until the second player opens the link. */
export function WaitingRoom({
  code,
  status,
  gameName,
  gameHref,
}: {
  code: string;
  status: ConnectionStatus;
  gameName: string;
  gameHref: string;
}) {
  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href={gameHref} className="text-sm text-muted hover:text-ink">
        ← {gameName}
      </Link>
      <h1 className="mt-2 text-3xl">Waiting for your friend</h1>
      <p className="mt-2 text-muted">
        Send this link to the person you want to play {gameName} with. The game starts as soon as they open it.
      </p>
      <ShareLink code={code} gameName={gameName} />
      <p className="mt-6 text-sm text-muted">
        Room code <b className="font-mono text-base tracking-widest text-ink">{code}</b>
        {status === "reconnecting" && " · Reconnecting..."}
      </p>
    </main>
  );
}

/** The leave button, room code, and rules button above an online board. */
export function RoomBar({ room, rules }: { room: RoomSnapshot; rules: ReactNode }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between gap-2">
      <LeaveButton
        label="← Leave"
        ask={room.you !== null && room.phase === "playing"}
        title="Leave the room?"
        detail="Your seat stays yours. Open the room link again to come back to the game."
        leaveLabel="Leave"
        onLeave={() => router.push("/games")}
      />
      <span className="text-sm text-muted">
        {room.you === null ? "Watching" : "Room"} <b className="font-mono tracking-widest text-ink">{room.code}</b>
      </span>
      <RulesButton>{rules}</RulesButton>
    </div>
  );
}

/**
 * Plays out each move the server sends if it follows the one on screen. If
 * moves were missed, for example after a reconnect, it jumps to the new board.
 */
export function useRoomMoves<State, Event>(
  update: RoomUpdate,
  show: (seat: Seat, events: Event[], final: State) => void,
  restart: (state: State) => void,
) {
  const [shown, setShown] = useState(update);
  if (update !== shown) {
    setShown(update);
    const { room, lastMove } = update;
    if (room.moveCount !== shown.room.moveCount) {
      if (lastMove && lastMove.moveNumber === shown.room.moveCount + 1) {
        show(lastMove.seat, lastMove.events as Event[], room.view as State);
      } else {
        restart(room.view as State);
      }
    }
  }
}

/** Tracks a move this player sent, so the board waits until the server answers. */
export function usePendingMove(moveCount: number, error: string | null) {
  const [sentAt, setSentAt] = useState<number | null>(null);
  return { waiting: sentAt === moveCount && error === null, markSent: () => setSentAt(moveCount) };
}

/** Puts "Your turn" in the tab title, so someone who switched tabs can see it's their move. */
export function useTurnTitle(yourTurn: boolean) {
  useEffect(() => {
    if (!yourTurn) return;
    const previous = document.title;
    document.title = "Your turn | Laro Tayo!";
    return () => {
      document.title = previous;
    };
  }, [yourTurn]);
}

/** The end of an online game: who won, and a button to ask for a rematch. */
export function RoomResult({
  room,
  outcome,
  names,
  detail,
  tieTitle,
  inline = false,
  send,
}: {
  room: RoomSnapshot;
  outcome: GameResult;
  names: [string, string];
  detail: string;
  tieTitle: string;
  /** Show the result under the board instead of over it. */
  inline?: boolean;
  send: (message: ClientMessage) => boolean;
}) {
  const you = room.you;
  const [winner] = outcome.winners;
  let title: string;
  if (winner === undefined) title = tieTitle;
  else if (you === null) title = `${names[winner]} wins`;
  else title = winner === you ? "You win" : "You lose";

  const other = you === null ? null : you === 0 ? 1 : 0;
  const youAsked = you !== null && room.rematch.includes(you);
  const theyAsked = other !== null && room.rematch.includes(other);

  return (
    <ResultCard title={title} detail={detail} inline={inline}>
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
