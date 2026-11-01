"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { gameFor, isGameId, type GameId } from "@laro/rooms";
import { GAMES } from "@/lib/games";
import { useIsClient, usePlayer, type LocalPlayer } from "@/lib/player";
import { ONLINE_ENABLED, roomPath } from "@/lib/rooms";
import { useMatch } from "@/lib/useMatch";
import { RoomMessage } from "./RoomMessage";
import "./match.css";

/** After this long with nobody else around, say so, so nobody waits without knowing. */
const QUIET_AFTER_S = 30;

/** Everything at /match/GAME/PLAYERS: waits in the lobby, then goes to the room once there's a match. */
export function MatchScreen() {
  const params = useParams<{ game: string; players: string }>();
  const isClient = useIsClient();
  const player = usePlayer();
  const gameId = params.game;
  const players = Number(params.players);

  if (!ONLINE_ENABLED) {
    return (
      <RoomMessage title="Online play isn't available here">
        <p>This copy of Laro Tayo! isn&apos;t connected to a room server.</p>
      </RoomMessage>
    );
  }
  const game = isGameId(gameId) ? gameFor(gameId) : null;
  if (!game || !Number.isInteger(players) || players < game.minSeats || players > game.maxSeats) {
    return (
      <RoomMessage title="That isn't a game we know">
        <Link href="/games" className="btn btn-primary">
          See all games
        </Link>
      </RoomMessage>
    );
  }
  const href = gamePage(gameId as GameId);
  if (!isClient) return <RoomMessage title="Finding a game..." />;
  if (!player) {
    return (
      <RoomMessage title="Pick a name first">
        <p>Other players see your name, so choose one before looking for a game.</p>
        <Link href={href} className="btn btn-primary">
          Back to {game.name}
        </Link>
      </RoomMessage>
    );
  }
  return <Looking gameId={gameId as GameId} name={game.name} href={href} players={players} player={player} />;
}

/** The page a room's game is played from. Games with more than one way to play, like "sinking-tiles-together", share their page. */
function gamePage(gameId: GameId): string {
  const info = GAMES.find((game) => gameId === game.id || gameId.startsWith(`${game.id}-`));
  return info?.href ?? "/games";
}

function Looking({
  gameId,
  name,
  href,
  players,
  player,
}: {
  gameId: GameId;
  name: string;
  href: string;
  players: number;
  player: LocalPlayer;
}) {
  const router = useRouter();
  const { status, here, error } = useMatch(gameId, players, player, (code) => router.replace(roomPath(code)));
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    // Counted from the start, since a tab in the background runs its timers late.
    const start = Date.now();
    const tick = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(tick);
  }, []);

  if (status === "elsewhere") {
    return (
      <RoomMessage title="You're looking in another tab">
        <p>You started looking for a game of {name} somewhere else, so this tab stopped.</p>
        <Link href={href} className="btn btn-secondary">
          Back to {name}
        </Link>
      </RoomMessage>
    );
  }

  const others = players - 1;
  const waited = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <main className="mx-auto max-w-md px-4 pb-16">
      <Link href={href} className="text-sm text-muted hover:text-ink">
        ← {name}
      </Link>
      <h1 className="mt-2 text-3xl">Finding a game</h1>
      <p className="mt-2 text-muted">
        {others === 1
          ? `Looking for someone else who wants to play ${name} right now.`
          : `Looking for ${others} other people who want to play ${name} right now.`}{" "}
        The game starts as soon as {others === 1 ? "they're" : "everyone's"} found.
      </p>

      <div className="match-wait mt-6" aria-live="polite">
        <span className="match-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="font-semibold">
          {status === "reconnecting"
            ? "Connection lost. Reconnecting..."
            : players > 2
              ? `${here} of ${players} players here`
              : "Waiting for another player"}
        </span>
        <span className="ml-auto font-mono text-muted tabular-nums" aria-label={`Waited ${seconds} seconds`}>
          {waited}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red">
          {error}
        </p>
      )}
      {seconds >= QUIET_AFTER_S && here < players && (
        <p className="mt-4 text-muted">
          Nobody else is looking right now. You can keep waiting, or go back and play the bot or send a friend a link.
        </p>
      )}

      <Link href={href} className="btn btn-secondary mt-6 w-full py-3.5">
        Stop looking
      </Link>
    </main>
  );
}
