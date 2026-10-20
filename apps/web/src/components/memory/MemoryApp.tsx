"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { MEMORY } from "./config";

export function MemoryApp() {
  return <BoardGameApp config={MEMORY} />;
}
