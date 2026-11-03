import type { Metadata } from "next";
import { DotsApp } from "@/components/dots-and-boxes/DotsApp";

export const metadata: Metadata = {
  title: "Dots and Boxes",
  description: "Play Dots and Boxes against a bot, with a friend on one phone, or online.",
};

export default function DotsAndBoxesPage() {
  return <DotsApp />;
}
