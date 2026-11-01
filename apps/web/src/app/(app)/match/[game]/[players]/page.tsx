import type { Metadata } from "next";
import { Suspense } from "react";
import { MatchScreen } from "@/components/room/MatchScreen";
import { RoomMessage } from "@/components/room/RoomMessage";

export const metadata: Metadata = {
  title: "Finding a game",
  robots: { index: false },
};

export default function MatchPage() {
  // The game is only known at request time, so the screen reads it with useParams inside Suspense.
  return (
    <Suspense fallback={<RoomMessage title="Finding a game..." />}>
      <MatchScreen />
    </Suspense>
  );
}
