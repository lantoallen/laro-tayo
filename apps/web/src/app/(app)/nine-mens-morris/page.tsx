import type { Metadata } from "next";
import { MorrisApp } from "@/components/morris/MorrisApp";

export const metadata: Metadata = {
  title: "Nine Men's Morris",
  description: "Play Nine Men's Morris against a bot or with a friend on one phone.",
};

export default function MorrisPage() {
  return <MorrisApp />;
}
