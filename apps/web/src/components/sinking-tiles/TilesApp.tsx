"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { SINKING_TILES } from "./config";

export function TilesApp() {
  return <BoardGameApp config={SINKING_TILES} />;
}
