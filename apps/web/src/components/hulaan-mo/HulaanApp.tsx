"use client";

import { useState } from "react";
import type { HulaanSettings } from "@laro/games/hulaan-mo";
import { HulaanGame } from "./HulaanGame";
import { HulaanSetup } from "./HulaanSetup";
import { DEFAULT_SETTINGS } from "./settings";

export function HulaanApp() {
  const [settings, setSettings] = useState<HulaanSettings>(DEFAULT_SETTINGS);
  const [game, setGame] = useState<number | null>(null);

  function start() {
    setGame((current) => (current ?? 0) + 1);
    window.scrollTo({ top: 0 });
  }

  if (game === null) return <HulaanSetup settings={settings} onChange={setSettings} onStart={start} />;
  return <HulaanGame key={game} settings={settings} onRematch={start} onExit={() => setGame(null)} />;
}
