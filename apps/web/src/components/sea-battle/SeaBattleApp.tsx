"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { SEA_BATTLE } from "./config";

export function SeaBattleApp() {
  return <BoardGameApp config={SEA_BATTLE} />;
}
