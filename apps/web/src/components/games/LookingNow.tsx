"use client";

import Link from "next/link";
import type { GameId } from "@laro/rooms";
import { roomGame } from "@/lib/games";
import { matchPath } from "@/lib/rooms";
import { useWaiting } from "@/lib/useWaiting";

/** Above the games: anyone waiting for a game with anyone right now, with a button to join them. Hidden when nobody is. */
export function LookingNow() {
  const waiting = useWaiting();
  const tables = Object.entries(waiting).flatMap(([wants, here]) => {
    const [gameId, count] = wants.split("/");
    const game = roomGame(gameId);
    const players = Number(count);
    return game && here > 0 ? [{ wants, gameId: gameId as GameId, name: game.name, players, here }] : [];
  });
  if (tables.length === 0) return null;

  return (
    <section aria-labelledby="looking-heading" className="card mt-6 p-4">
      <h2 id="looking-heading" className="flex items-center gap-2 text-lg">
        <span aria-hidden="true" className="inline-block size-2.5 rounded-full bg-red" />
        Looking for a game right now
      </h2>
      <ul className="mt-3 divide-y divide-line">
        {tables.map(({ wants, gameId, name, players, here }) => (
          <li key={wants} className="flex items-center justify-between gap-3 py-2">
            <span>
              <b>{name}</b>
              <span className="text-muted">
                {players === 2
                  ? " · someone wants a game"
                  : ` · ${here} of ${players} players waiting`}
              </span>
            </span>
            <Link
              href={matchPath(gameId, players)}
              aria-label={`Join a game of ${name}`}
              className="btn btn-primary btn-small shrink-0"
            >
              Join
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
