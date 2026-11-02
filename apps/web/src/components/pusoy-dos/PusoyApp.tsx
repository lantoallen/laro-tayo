"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BotLevel } from "@laro/games";
import { savePlayerName } from "@/lib/player";
import { createRoom, matchPath, roomPath } from "@/lib/rooms";
import { PusoyGame } from "./PusoyGame";
import { PusoySetup, type PusoyMode } from "./PusoySetup";

export function PusoyApp() {
  const [mode, setMode] = useState<PusoyMode>("bot");
  const [level, setLevel] = useState<BotLevel>("medium");
  const [players, setPlayers] = useState(4);
  const [deal, setDeal] = useState<number | null>(null);
  const router = useRouter();

  async function startOnline(name: string, anyone: boolean) {
    savePlayerName(name);
    router.push(anyone ? matchPath("pusoy-dos", players) : roomPath(await createRoom("pusoy-dos", players)));
  }

  function start() {
    setDeal((current) => (current ?? 0) + 1);
    window.scrollTo({ top: 0 });
  }

  if (deal === null) {
    return (
      <PusoySetup
        mode={mode}
        onMode={setMode}
        level={level}
        onLevel={setLevel}
        players={players}
        onPlayers={setPlayers}
        onStart={start}
        onStartOnline={startOnline}
      />
    );
  }
  return <PusoyGame key={deal} level={level} players={players} onRematch={start} onExit={() => setDeal(null)} />;
}
