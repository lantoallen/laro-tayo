import type { Metadata } from "next";
import { MemoryApp } from "@/components/memory/MemoryApp";

export const metadata: Metadata = {
  title: "Memory",
  description: "Play Memory, the card matching game, against a bot or with a friend on one phone.",
};

export default function MemoryPage() {
  return <MemoryApp />;
}
