import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomMessage } from "@/components/room/RoomMessage";
import { RoomScreen } from "@/components/room/RoomScreen";

export const metadata: Metadata = {
  title: "Join my game",
  description: "Open this link to play with me on Laro Tayo!",
  openGraph: {
    title: "Join my game",
    description: "Open this link to play with me on Laro Tayo!",
  },
  // Room links are private invites, so keep them out of search results.
  robots: { index: false },
};

export default function RoomPage() {
  // The room code is only known at request time, so the screen reads it with useParams inside Suspense.
  return (
    <Suspense fallback={<RoomMessage title="Opening the room..." />}>
      <RoomScreen />
    </Suspense>
  );
}
