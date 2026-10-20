"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { REVERSI } from "./config";

export function ReversiApp() {
  return <BoardGameApp config={REVERSI} />;
}
