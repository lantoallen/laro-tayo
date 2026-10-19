"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { isRoomCode } from "@laro/rooms";
import { OnlineSungka } from "@/components/sungka/OnlineSungka";
import { savePlayerName, useIsClient, usePlayer, type LocalPlayer } from "@/lib/player";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { useRoom } from "@/lib/useRoom";
import { NameField } from "./NameField";
import { RoomMessage } from "./RoomMessage";

/** Everything at /room/CODE: asks for a name if needed, joins the room, and shows its game. */
export function RoomScreen() {
  const code = useParams<{ code: string }>().code.toUpperCase();
  const isClient = useIsClient();
  const player = usePlayer();

  if (!ONLINE_ENABLED) {
    return (
      <RoomMessage title="Online play isn't available here">
        <p>This copy of Laro Tayo! isn&apos;t connected to a room server.</p>
      </RoomMessage>
    );
  }
  if (!isRoomCode(code)) {
    return (
      <RoomMessage title="That isn't a room link">
        <p>Room codes are 5 letters and numbers. Check the link you were sent.</p>
      </RoomMessage>
    );
  }
  if (!isClient) return <RoomMessage title="Opening the room..." />;
  if (!player) return <JoinForm />;
  return <Room code={code} player={player} />;
}

function JoinForm() {
  const [name, setName] = useState("");
  return (
    <main className="mx-auto max-w-md px-4 pt-6 pb-16">
      <h1 className="text-2xl font-bold">Join the game</h1>
      <p className="mt-2 text-muted">Pick a name so the other player knows it&apos;s you.</p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          savePlayerName(name);
        }}
      >
        <NameField value={name} onChange={setName} />
        <button type="submit" className="btn btn-primary w-full py-3.5">
          Join
        </button>
      </form>
    </main>
  );
}

function Room({ code, player }: { code: string; player: LocalPlayer }) {
  const { status, update, error, send } = useRoom(code, player);

  if (status === "missing") {
    return (
      <RoomMessage title="This room doesn't exist">
        <p>The link may be wrong, or the room was closed after a day without any games.</p>
        <Link href="/sungka" className="btn btn-primary">
          Start a new game
        </Link>
      </RoomMessage>
    );
  }
  if (!update) {
    return <RoomMessage title={status === "reconnecting" ? "Can't reach the room. Trying again..." : "Joining the room..."} />;
  }
  return <OnlineSungka update={update} status={status} error={error} send={send} />;
}
