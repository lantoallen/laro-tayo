import type { Metadata } from "next";
import { PigApp } from "@/components/pig/PigApp";

export const metadata: Metadata = {
  title: "Pig",
  description: "Play Pig, the push-your-luck dice game, against a bot or with a friend on one phone.",
};

export default function PigPage() {
  return <PigApp />;
}
