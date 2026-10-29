"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ROOM_VERSION, isRoomCode } from "@laro/rooms";
import { OnlineBoardGame } from "@/components/board-game/OnlineBoardGame";
import { OnlineDama } from "@/components/dama/OnlineDama";
import { DOTS_AND_BOXES } from "@/components/dots-and-boxes/config";
import { FOUR_IN_A_ROW } from "@/components/four-in-a-row/config";
import { JAK_EN_POY } from "@/components/jak-en-poy/config";
import { MEMORY } from "@/components/memory/config";
import { MORRIS } from "@/components/morris/config";
import { PIG } from "@/components/pig/config";
import { REVERSI } from "@/components/reversi/config";
import { SEA_BATTLE } from "@/components/sea-battle/config";
import { SINKING_TILES, SINKING_TILES_TOGETHER } from "@/components/sinking-tiles/config";
import { SNAKES_AND_LADDERS } from "@/components/snakes-and-ladders/config";
import { OnlineSungka } from "@/components/sungka/OnlineSungka";
import { TIC_TAC_TOE } from "@/components/tic-tac-toe/config";
import { savePlayerName, useIsClient, usePlayer, type LocalPlayer } from "@/lib/player";
import { ONLINE_ENABLED } from "@/lib/rooms";
import { useRoom } from "@/lib/useRoom";
import { NameField } from "./NameField";
import type { OnlineProps } from "./online";
import { Reactions } from "./Reactions";
import { RoomMessage } from "./RoomMessage";
import { UpdateNotice } from "./UpdateNotice";

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
  const { status, update, error, send, serverVersion, reactions } = useRoom(code, player);

  if (status === "missing") {
    return (
      <RoomMessage title="This room doesn't exist">
        <p>The code or link may be wrong, or the room was closed after a day without any games.</p>
        <Link href="/games" className="btn btn-primary">
          Start a new game
        </Link>
      </RoomMessage>
    );
  }
  if (!update) {
    return <RoomMessage title={status === "reconnecting" ? "Can't reach the room. Trying again..." : "Joining the room..."} />;
  }
  const { room } = update;
  const outOfStep = serverVersion !== null && serverVersion !== ROOM_VERSION;
  return (
    <>
      {outOfStep && <UpdateNotice newer={serverVersion > ROOM_VERSION} />}
      <Game {...{ update, status, error, send }} />
      {/* Players can react once the game is on. Someone watching can't. */}
      {room.you !== null && room.phase !== "waiting" && <Reactions room={room} reactions={reactions} send={send} />}
    </>
  );
}

/** The screen for the room's game. */
function Game(props: OnlineProps) {
  switch (props.update.room.gameId) {
    case "dama":
      return <OnlineDama {...props} />;
    case "four-in-a-row":
      return <OnlineBoardGame config={FOUR_IN_A_ROW} {...props} />;
    case "reversi":
      return <OnlineBoardGame config={REVERSI} {...props} />;
    case "dots-and-boxes":
      return <OnlineBoardGame config={DOTS_AND_BOXES} {...props} />;
    case "memory":
      return <OnlineBoardGame config={MEMORY} {...props} />;
    case "morris":
      return <OnlineBoardGame config={MORRIS} {...props} />;
    case "sea-battle":
      return <OnlineBoardGame config={SEA_BATTLE} {...props} />;
    case "tic-tac-toe":
      return <OnlineBoardGame config={TIC_TAC_TOE} {...props} />;
    case "snakes-and-ladders":
      return <OnlineBoardGame config={SNAKES_AND_LADDERS} {...props} />;
    case "pig":
      return <OnlineBoardGame config={PIG} {...props} />;
    case "jak-en-poy":
      return <OnlineBoardGame config={JAK_EN_POY} {...props} />;
    case "sinking-tiles":
      return <OnlineBoardGame config={SINKING_TILES} {...props} />;
    case "sinking-tiles-together":
      return <OnlineBoardGame config={SINKING_TILES_TOGETHER} {...props} />;
    default:
      return <OnlineSungka {...props} />;
  }
}
