import type { Metadata } from "next";
import { DamaApp } from "@/components/dama/DamaApp";

export const metadata: Metadata = {
  title: "Dama",
  description: "Play Dama, Filipino checkers, against a bot or with a friend on one phone.",
};

export default function DamaPage() {
  return <DamaApp />;
}
