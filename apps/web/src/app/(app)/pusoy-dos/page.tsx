import type { Metadata } from "next";
import { PusoyApp } from "@/components/pusoy-dos/PusoyApp";

export const metadata: Metadata = {
  title: "Pusoy Dos",
  description: "Play Pusoy Dos, the Filipino card game, against bots or with friends online.",
};

export default function PusoyDosPage() {
  return <PusoyApp />;
}
