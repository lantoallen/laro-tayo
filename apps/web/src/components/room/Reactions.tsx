"use client";

import { useEffect, useRef, useState } from "react";
import { REACTIONS, type ClientMessage, type Reaction, type RoomSnapshot } from "@laro/rooms";
import { playSound } from "@/lib/sound";
import type { ShownReaction } from "@/lib/useRoom";
import { seatNames } from "./online";
import "./reactions.css";

const LOOKS: Record<Reaction, { text: string; label: string }> = {
  thumbs: { text: "👍", label: "Thumbs up" },
  laugh: { text: "😂", label: "Laughing" },
  wow: { text: "😮", label: "Wow" },
  cry: { text: "😭", label: "Crying" },
  nice: { text: "Nice!", label: "Nice!" },
  gg: { text: "GG", label: "Good game" },
};

/** Matches the gap the server keeps between one player's reactions. */
const COOLDOWN_MS = 700;

/**
 * Buttons for sending a quick reaction to everyone in the room, and the
 * reactions everyone sends, floating up for a moment.
 */
export function Reactions({
  room,
  reactions,
  send,
}: {
  room: RoomSnapshot;
  reactions: readonly ShownReaction[];
  send: (message: ClientMessage) => boolean;
}) {
  const names = seatNames(room);
  const [cooling, setCooling] = useState(false);

  // A soft pop when someone else reacts.
  const heard = useRef(new Set<number>());
  useEffect(() => {
    for (const reaction of reactions) {
      if (heard.current.has(reaction.id)) continue;
      heard.current.add(reaction.id);
      if (reaction.seat !== room.you) playSound("pop");
    }
  }, [reactions, room.you]);

  useEffect(() => {
    if (!cooling) return;
    const timer = setTimeout(() => setCooling(false), COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [cooling]);

  function react(reaction: Reaction) {
    if (send({ type: "react", reaction })) setCooling(true);
  }

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <div role="group" aria-label="Send a reaction" className="rx-bar">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction}
              type="button"
              onClick={() => react(reaction)}
              disabled={cooling}
              aria-label={LOOKS[reaction].label}
              className="rx-button"
            >
              {LOOKS[reaction].text}
            </button>
          ))}
        </div>
      </div>
      <div className="rx-bubbles" aria-live="polite">
        {reactions.map((reaction) => (
          <p key={reaction.id} className="rx-bubble">
            <b>{reaction.seat === room.you ? "You" : names[reaction.seat]}</b>{" "}
            <span className="rx-text">{LOOKS[reaction.reaction].text}</span>
          </p>
        ))}
      </div>
    </>
  );
}
