import type { Metadata } from "next";
import { NimApp } from "@/components/nim/NimApp";

export const metadata: Metadata = {
  title: "Nim",
  description: "Play Nim, the take-away game, against a bot, with a friend on one phone, or online.",
};

export default function NimPage() {
  return <NimApp />;
}
