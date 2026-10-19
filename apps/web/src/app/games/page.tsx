import type { Metadata } from "next";
import { GameList } from "@/components/games/GameList";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Games",
  description: "Pick a Filipino game to play on your phone.",
};

export default function GamesPage() {
  return (
    <>
      <main className="mx-auto max-w-4xl px-4">
        <h1 className="mt-4 text-3xl font-bold">Pick a game</h1>
        <GameList />
      </main>
      <SiteFooter />
    </>
  );
}
