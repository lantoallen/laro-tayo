import type { Metadata } from "next";
import { DamaApp } from "@/components/dama/DamaApp";

export const metadata: Metadata = {
  title: "Dama",
  description: "Play Dama, Filipino checkers, against a bot, with a friend on one phone, or online.",
};

export default function DamaPage() {
  return <DamaApp />;
}
