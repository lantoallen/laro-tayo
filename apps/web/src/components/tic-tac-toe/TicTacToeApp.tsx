"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { TIC_TAC_TOE } from "./config";

export function TicTacToeApp() {
  return <BoardGameApp config={TIC_TAC_TOE} />;
}
