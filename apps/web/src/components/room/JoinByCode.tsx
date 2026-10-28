"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { roomCodeFrom } from "@laro/rooms";
import { ONLINE_ENABLED, roomPath } from "@/lib/rooms";
import { useIsOnline } from "@/lib/useIsOnline";

/** A box for the room code a friend reads out, for when they didn't send the link. */
export function JoinByCode() {
  const router = useRouter();
  const connected = useIsOnline();
  const [text, setText] = useState("");
  const [wrong, setWrong] = useState(false);
  if (!ONLINE_ENABLED) return null;

  return (
    <form
      className="w-full sm:w-auto"
      onSubmit={(event) => {
        event.preventDefault();
        const code = roomCodeFrom(text);
        if (code) router.push(roomPath(code));
        else setWrong(true);
      }}
    >
      <label htmlFor="room-code" className="mb-1.5 block text-sm font-semibold">
        Have a room code?
      </label>
      <div className="flex gap-2">
        <input
          id="room-code"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setWrong(false);
          }}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          aria-invalid={wrong}
          aria-describedby={wrong ? "room-code-problem" : undefined}
          className="field font-mono tracking-widest uppercase sm:w-36"
        />
        <button type="submit" disabled={!connected} className="btn btn-secondary btn-small px-4">
          Join
        </button>
      </div>
      {wrong && (
        <p id="room-code-problem" role="alert" className="mt-1.5 text-sm text-red sm:max-w-64">
          Room codes are 5 letters and numbers, and never use I, L, O, 0, or 1.
        </p>
      )}
      {!connected && <p className="mt-1.5 text-sm text-muted">You&apos;re offline. Joining needs a connection.</p>}
    </form>
  );
}
