"use client";

import { useState } from "react";
import { useIsClient } from "@/lib/player";
import { roomPath } from "@/lib/rooms";

/** The invite link for a room, with buttons to copy it or open the phone's share sheet. */
export function ShareLink({ code, gameName }: { code: string; gameName: string }) {
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
        className="field text-sm"
      />
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={copy} className="btn btn-primary flex-1">
          {copied ? "Copied" : "Copy link"}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={() => navigator.share({ title: `Play ${gameName} with me`, url }).catch(() => {})}
            className="btn btn-secondary flex-1"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}
