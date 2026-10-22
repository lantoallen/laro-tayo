import type { Metadata } from "next";
import { SnakesApp } from "@/components/snakes-and-ladders/SnakesApp";

export const metadata: Metadata = {
  title: "Snakes and Ladders",
  description: "Play Snakes and Ladders against a bot or with a friend on one phone.",
};

export default function SnakesAndLaddersPage() {
  return <SnakesApp />;
}
