"use client";

import { useRef } from "react";
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from "./parts";

/** A back button that asks first when leaving would interrupt a game. */
export function LeaveButton({
  label,
  ask,
  title,
  detail,
  leaveLabel,
  onLeave,
}: {
  label: string;
  /** Whether to ask before leaving. When false the button leaves straight away. */
  ask: boolean;
  title: string;
  detail: string;
  leaveLabel: string;
  onLeave: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => (ask ? dialog.current?.showModal() : onLeave())}
        className="text-sm text-muted hover:text-ink"
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="leave-title"
        className="m-auto w-[min(22rem,calc(100%-2rem))] rounded-xl border border-line bg-surface p-5 text-ink backdrop:bg-black/50"
      >
        <h2 id="leave-title" className="text-lg font-bold">
          {title}
        </h2>
        <p className="mt-1 text-muted">{detail}</p>
        <div className="mt-5 grid gap-2">
          <button type="button" onClick={() => dialog.current?.close()} className={PRIMARY_BUTTON} autoFocus>
            Keep playing
          </button>
          <button
            type="button"
            onClick={() => {
              dialog.current?.close();
              onLeave();
            }}
            className={SECONDARY_BUTTON}
          >
            {leaveLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
