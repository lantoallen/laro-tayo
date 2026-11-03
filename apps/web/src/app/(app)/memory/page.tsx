import type { Metadata } from "next";
import { MemoryApp } from "@/components/memory/MemoryApp";

export const metadata: Metadata = {
  title: "Memory",
  description: "Play Memory, the card matching game, against a bot, with a friend on one phone, or online.",
};

export default function MemoryPage() {
  return <MemoryApp />;
}
