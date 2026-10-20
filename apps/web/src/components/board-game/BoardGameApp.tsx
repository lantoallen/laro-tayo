"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Seat } from "@laro/games";
import { DEFAULT_TWO_PLAYER, firstSeatFor, type TwoPlayerSettings } from "@/components/game/settings";
import { savePlayerName } from "@/lib/player";
import { createRoom, roomPath } from "@/lib/rooms";
import { BoardGameSetup } from "./BoardGameSetup";
import { LocalBoardGame } from "./LocalBoardGame";
import type { BoardGameConfig } from "./types";

/** The setup screen, then the game. Online games go to their room instead. */
export function BoardGameApp<State, Move>({ config }: { config: BoardGameConfig<State, Move> }) {
  const [settings, setSettings] = useState<TwoPlayerSettings>(DEFAULT_TWO_PLAYER);
  const [match, setMatch] = useState<{ id: number; firstSeat: Seat } | null>(null);
  const router = useRouter();

  async function startOnline(name: string) {
    if (!config.roomId) return;
    savePlayerName(name);
    router.push(roomPath(await createRoom(config.roomId)));
  }

  function start() {
    const firstSeat = firstSeatFor(settings.first);
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
