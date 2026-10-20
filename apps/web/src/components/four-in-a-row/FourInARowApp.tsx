"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { FOUR_IN_A_ROW } from "./config";

export function FourInARowApp() {
  return <BoardGameApp config={FOUR_IN_A_ROW} />;
}
