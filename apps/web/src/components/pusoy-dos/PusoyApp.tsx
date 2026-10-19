"use client";

import { useState } from "react";
import type { BotLevel } from "@laro/games";
import { PusoyGame } from "./PusoyGame";
import { PusoySetup } from "./PusoySetup";

export function PusoyApp() {
  const [level, setLevel] = useState<BotLevel>("medium");
  const [deal, setDeal] = useState<number | null>(null);

  function start() {
    setDeal((current) => (current ?? 0) + 1);
    window.scrollTo({ top: 0 });
  }

  if (deal === null) return <PusoySetup level={level} onLevel={setLevel} onStart={start} />;
  return <PusoyGame key={deal} level={level} onRematch={start} onExit={() => setDeal(null)} />;
}
