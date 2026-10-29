import type { Metadata } from "next";
import { TilesApp } from "@/components/sinking-tiles/TilesApp";

export const metadata: Metadata = {
  title: "Sinking Tiles",
  description: "Step across floating tiles that sink under you. Play against bots, on one phone, or online.",
};

export default function SinkingTilesPage() {
  return <TilesApp />;
}
