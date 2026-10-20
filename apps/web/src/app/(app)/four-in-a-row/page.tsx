import type { Metadata } from "next";
import { FourInARowApp } from "@/components/four-in-a-row/FourInARowApp";

export const metadata: Metadata = {
  title: "Four in a Row",
  description: "Play Four in a Row against a bot or with a friend on one phone.",
};

export default function FourInARowPage() {
  return <FourInARowApp />;
}
