import type { Metadata } from "next";
import { ReversiApp } from "@/components/reversi/ReversiApp";

export const metadata: Metadata = {
  title: "Reversi",
  description: "Play Reversi against a bot, with a friend on one phone, or online.",
};

export default function ReversiPage() {
  return <ReversiApp />;
}
