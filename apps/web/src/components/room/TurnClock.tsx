"use client";

import { useEffect, useState } from "react";
import type { ClientMessage, RoomSnapshot } from "@laro/rooms";
import { PRIMARY_BUTTON } from "@/components/game/parts";
import { RoundClock } from "@/components/game/RoundClock";

/** The clock only shows for the last part of a turn, so nobody feels rushed. */
const SHOW_LAST_MS = 20_000;

/**
 * Under the board in an online game that takes turns: the time left for the
 * move once it's getting short, and, for a player who's away, a way to take
 * their turns back from the bot.
 */
export function TurnClock({ room, send }: { room: RoomSnapshot; send: (message: ClientMessage) => boolean }) {
  const you = room.you;
  const away = you !== null && room.seats[you]?.away === true;
  return (
    <>
      {away && (
        <div className="away-notice" role="status">
          <p>You missed your last turns, so the bot is playing for you.</p>
          <button type="button" className={PRIMARY_BUTTON} onClick={() => send({ type: "back" })}>
            I&apos;m back
          </button>
        </div>
      )}
      {room.phase === "playing" && room.timeLeftMs !== null && (
        // Every update brings the time left from the server, so the clock starts over from that.
        <TimeLeft key={`${room.round}-${room.moveCount}-${room.timeLeftMs}`} ms={room.timeLeftMs} />
      )}
    </>
  );
}

function TimeLeft({ ms }: { ms: number }) {
  const [shown, setShown] = useState<number | null>(ms <= SHOW_LAST_MS ? ms : null);
  useEffect(() => {
    if (shown !== null) return;
    const show = setTimeout(() => setShown(SHOW_LAST_MS), ms - SHOW_LAST_MS);
    return () => clearTimeout(show);
  }, [ms, shown]);
  // The server moves when time is up, so this only shows how long is left.
  return shown === null ? null : <RoundClock ms={shown} total={SHOW_LAST_MS} />;
}
