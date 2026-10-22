"use client";

import { BoardGameApp } from "@/components/board-game/BoardGameApp";
import { JAK_EN_POY } from "./config";

export function JakApp() {
  return <BoardGameApp config={JAK_EN_POY} />;
}
