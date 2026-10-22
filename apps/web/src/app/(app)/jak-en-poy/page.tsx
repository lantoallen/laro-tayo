import type { Metadata } from "next";
import { JakApp } from "@/components/jak-en-poy/JakApp";

export const metadata: Metadata = {
  title: "Jak-en-poy",
  description: "Play Jak-en-poy, rock paper scissors, against a bot or with a friend.",
};

export default function JakEnPoyPage() {
  return <JakApp />;
}
