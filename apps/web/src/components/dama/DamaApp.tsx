"use client";

import { useState } from "react";
import type { Seat } from "@laro/games";
import { firstSeatFor } from "@/components/game/settings";
import { DamaGame } from "./DamaGame";
import { DamaSetup } from "./DamaSetup";
import { DEFAULT_SETTINGS, type DamaSettings } from "./settings";

export function DamaApp() {
  const [settings, setSettings] = useState<DamaSettings>(DEFAULT_SETTINGS);
  const [match, setMatch] = useState<{ id: number; firstSeat: Seat } | null>(null);

  function start() {
    const firstSeat = firstSeatFor(settings.first);
    setMatch((current) => ({ id: (current?.id ?? 0) + 1, firstSeat }));
    window.scrollTo({ top: 0 });
  }

  if (!match) return <DamaSetup settings={settings} onChange={setSettings} onStart={start} />;
  return (
    <DamaGame
      key={match.id}
      settings={settings}
      firstSeat={match.firstSeat}
      onRematch={start}
      onExit={() => setMatch(null)}
    />
  );
}
