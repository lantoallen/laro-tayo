"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { MORRIS } from "./config";

export function MorrisApp() {
  return <BoardGameApp config={MORRIS} />;
}
