import type { Metadata } from "next";
import { FourInARowApp } from "@/components/four-in-a-row/FourInARowApp";

export const metadata: Metadata = {
  title: "Four in a Row",
  description: "Play Four in a Row against a bot, with a friend on one phone, or online.",
};

export default function FourInARowPage() {
  return <FourInARowApp />;
}
