import type { Metadata } from "next";
import { TicTacToeApp } from "@/components/tic-tac-toe/TicTacToeApp";

export const metadata: Metadata = {
  title: "Tic-Tac-Toe",
  description: "Play Tic-Tac-Toe against a bot, with a friend on one phone, or online.",
};

export default function TicTacToePage() {
  return <TicTacToeApp />;
}
