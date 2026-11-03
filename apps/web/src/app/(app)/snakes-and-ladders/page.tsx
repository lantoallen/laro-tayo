import type { Metadata } from "next";
import { SnakesApp } from "@/components/snakes-and-ladders/SnakesApp";

export const metadata: Metadata = {
  title: "Snakes and Ladders",
  description: "Play Snakes and Ladders against a bot, with a friend on one phone, or online.",
};

export default function SnakesAndLaddersPage() {
  return <SnakesApp />;
}
