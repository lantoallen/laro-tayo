"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Seat } from "@laro/games";
import { savePlayerName } from "@/lib/player";
import { createRoom, roomPath } from "@/lib/rooms";
import { SungkaGame } from "./SungkaGame";
import { SungkaSetup } from "./SungkaSetup";
import { DEFAULT_SETTINGS, firstSeatFor, type SungkaSettings } from "./settings";

export function SungkaApp() {
  const [settings, setSettings] = useState<SungkaSettings>(DEFAULT_SETTINGS);
  const [match, setMatch] = useState<{ id: number; firstSeat: Seat } | null>(null);

  const router = useRouter();

  async function startOnline(name: string) {
    savePlayerName(name);
    router.push(roomPath(await createRoom("sungka")));
  }

  function start() {
    const firstSeat = firstSeatFor(settings.first);
    setMatch((current) => ({ id: (current?.id ?? 0) + 1, firstSeat }));
    window.scrollTo({ top: 0 });
  }

  if (!match) {
    return <SungkaSetup settings={settings} onChange={setSettings} onStart={start} onStartOnline={startOnline} />;
  }
  return (
    <SungkaGame
      key={match.id}
      settings={settings}
      firstSeat={match.firstSeat}
      onRematch={start}
      onExit={() => setMatch(null)}
    />
  );
}
