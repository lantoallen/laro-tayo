"use client";

import { useState } from "react";
import { useIsClient } from "@/lib/player";
import { roomPath } from "@/lib/rooms";

/** The invite link for a room, with buttons to copy it or open the phone's share sheet. */
export function ShareLink({ code }: { code: string }) {
  const isClient = useIsClient();
  const [copied, setCopied] = useState(false);
  const url = isClient ? `${window.location.origin}${roomPath(code)}` : roomPath(code);
  const canShare = isClient && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be blocked. The link is still on screen to copy by hand.
    }
  }

  return (
    <div className="mt-6">
      <label htmlFor="room-link" className="mb-2 block font-semibold">
        Invite link
      </label>
      <input
        id="room-link"
        readOnly
        value={url}
        onFocus={(event) => event.target.select()}
        className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm"
      />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={copy} className="flex-1 rounded-lg bg-blue py-2.5 font-semibold text-blue-ink">
          {copied ? "Copied" : "Copy link"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title: "Play Sungka with me", url }).catch(() => {})}
            className="flex-1 rounded-lg border border-line py-2.5 font-semibold"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
