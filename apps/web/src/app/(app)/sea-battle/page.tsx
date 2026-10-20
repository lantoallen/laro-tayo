import type { Metadata } from "next";
import { SeaBattleApp } from "@/components/sea-battle/SeaBattleApp";

export const metadata: Metadata = {
  title: "Sea Battle",
  description: "Play Sea Battle against a bot or online with a friend.",
};

export default function SeaBattlePage() {
  return <SeaBattleApp />;
}
