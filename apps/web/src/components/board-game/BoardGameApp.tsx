"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Seat } from "@laro/games";
import { DEFAULT_BOARD_GAME, firstSeatFor, type BoardGameSettings } from "@/components/game/settings";
import { savePlayerName } from "@/lib/player";
import { createRoom, roomPath } from "@/lib/rooms";
import { BoardGameSetup } from "./BoardGameSetup";
import { LocalBoardGame } from "./LocalBoardGame";
import type { BoardGameConfig } from "./types";

/** The setup screen, then the game. Online games go to their room instead. */
export function BoardGameApp<State, Move>({
  config,
  choices,
}: {
  config: BoardGameConfig<State, Move>;
  /** More choices for the setup screen, shown first, like a game that can be played two ways. */
  choices?: ReactNode;
}) {
  const [chosen, setSettings] = useState<BoardGameSettings>(DEFAULT_BOARD_GAME);
  // A choice made for another way of playing may not be there in this one.
  const settings: BoardGameSettings = config.passAndPlay === false && chosen.mode === "local" ? { ...chosen, mode: "bot" } : chosen;
  const { minSeats, maxSeats } = config.game;
  const players = Math.min(maxSeats, Math.max(minSeats, settings.players));
  const [match, setMatch] = useState<{ id: number; firstSeat: Seat } | null>(null);
  const router = useRouter();

  async function startOnline(name: string) {
    if (!config.roomId) return;
    savePlayerName(name);
    router.push(roomPath(await createRoom(config.roomId, players)));
  }

  function start() {
    const firstSeat = firstSeatFor(settings.first, players);
    setMatch((current) => ({ id: (current?.id ?? 0) + 1, firstSeat }));
    window.scrollTo({ top: 0 });
  }

  if (!match) {
    return (
      <BoardGameSetup
        config={config}
        settings={settings}
        onChange={setSettings}
        onStart={start}
        onStartOnline={startOnline}
        choices={choices}
      />
    );
  }
  return (
    <LocalBoardGame
      key={match.id}
      config={config}
      settings={settings}
      firstSeat={match.firstSeat}
      onRematch={start}
      onExit={() => setMatch(null)}
    />
  );
}
