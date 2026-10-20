import type { Metadata } from "next";
import { DotsApp } from "@/components/dots-and-boxes/DotsApp";

export const metadata: Metadata = {
  title: "Dots and Boxes",
  description: "Play Dots and Boxes against a bot or with a friend on one phone.",
};

export default function DotsAndBoxesPage() {
  return <DotsApp />;
}
