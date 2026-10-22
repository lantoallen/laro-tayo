import type { Metadata } from "next";
import { TicTacToeApp } from "@/components/tic-tac-toe/TicTacToeApp";

export const metadata: Metadata = {
  title: "Tic-Tac-Toe",
  description: "Play Tic-Tac-Toe against a bot or with a friend on one phone.",
};

export default function TicTacToePage() {
  return <TicTacToeApp />;
}
