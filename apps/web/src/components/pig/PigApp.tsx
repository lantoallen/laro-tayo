"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { PIG } from "./config";

export function PigApp() {
  return <BoardGameApp config={PIG} />;
}
