"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { DOTS_AND_BOXES } from "./config";

export function DotsApp() {
  return <BoardGameApp config={DOTS_AND_BOXES} />;
}
