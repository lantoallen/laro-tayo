"use client";

/**
 * Shown when this page and the room server are from different versions of the
 * game, which happens for a minute or so while an update goes out. `newer` is
 * true when the server has the update and this page doesn't yet.
 */
export function UpdateNotice({ newer }: { newer: boolean }) {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-3">
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-xl border-[3px] border-outline bg-yellow px-3 py-2 text-sm text-yellow-ink shadow-[3px_3px_0_var(--outline)]"
      >
        <p>
          {newer
            ? "Laro Tayo! was just updated. Refresh to keep playing."
            : "The game server is being updated. If moves stop working, wait a minute and refresh."}
        </p>
        <button type="button" onClick={() => location.reload()} className="btn btn-secondary btn-small shrink-0">
          Refresh
        </button>
      </div>
    </div>
  );
}
