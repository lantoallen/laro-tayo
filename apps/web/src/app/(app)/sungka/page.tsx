import type { Metadata } from "next";
import { SungkaApp } from "@/components/sungka/SungkaApp";

export const metadata: Metadata = {
  title: "Sungka",
  description: "Play Sungka, the classic Filipino shell game, against a bot, with a friend on one phone, or online.",
};

export default function SungkaPage() {
  return <SungkaApp />;
}
