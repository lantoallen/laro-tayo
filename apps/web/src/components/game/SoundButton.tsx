"use client";

import { playSound, setSoundOn, useSoundOn } from "@/lib/sound";

/** Turns the game sounds on and off. The choice is remembered on this device. */
export function SoundButton() {
  const on = useSoundOn();
  return (
    <button
      type="button"
      onClick={() => {
        setSoundOn(!on);
        if (!on) playSound("tap");
      }}
      aria-pressed={on}
      aria-label="Sound"
      title={on ? "Sound is on" : "Sound is off"}
      className="btn btn-secondary btn-small size-9 px-0"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" strokeLinejoin="round" />
        {on ? (
          <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" strokeLinecap="round" />
        ) : (
          <path d="m16 9 5 6m0-6-5 6" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
