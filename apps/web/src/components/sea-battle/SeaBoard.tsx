import type { Seat } from "@laro/games";
import {
  FLEET,
  SHIP_NAMES,
  colOf,
  isSunk,
  otherSeat,
  rowOf,
  view,
  type SeaMove,
  type SeaState,
  type Ship,
  type Shot,
} from "@laro/games/sea-battle";
import type { BoardProps } from "@/components/board-game/types";
import "./sea.css";

const FILES = "ABCDEFGHIJ";
const cellName = (cell: number) => `${FILES[colOf(cell)]}${rowOf(cell) + 1}`;

/** A 10 by 10 grid of water showing one fleet and the shots fired at it. */
function Waters({
  fleet,
  shots,
  lastShot,
  sinking = [],
  onFire,
  small = false,
}: {
  fleet: readonly Ship[];
  /** The other player's shots at this fleet. */
  shots: readonly Shot[];
  lastShot: number | null;
  /** The cells of a ship the last shot sank. */
  sinking?: readonly number[];
  onFire?: (cell: number) => void;
  small?: boolean;
}) {
  const shipAt = (cell: number) => fleet.find((ship) => ship?.includes(cell)) ?? null;
  return (
    <div className={`sb-grid ${small ? "sb-small" : ""}`}>
      {shots.map((shot, cell) => {
        const ship = shipAt(cell);
        const className = [
          "sb-cell",
          ship && "sb-ship",
          ship && isSunk(ship, shots) && "sb-sunk",
          shot && `sb-${shot}`,
          cell === lastShot && "sb-last",
          sinking.includes(cell) && "sb-sinking",
        ]
          .filter(Boolean)
          .join(" ");
        const what = shot === "hit" ? "hit" : shot === "miss" ? "miss" : ship ? "ship" : "water";
        const label = `${cellName(cell)}: ${what}`;
        if (onFire && shot === null) {
          return (
            <button
              key={cell}
              type="button"
              aria-label={`${label}, fire here`}
              onClick={() => onFire(cell)}
              className={className}
            />
          );
        }
        return <span key={cell} role="img" aria-label={label} className={className} />;
      })}
    </div>
  );
}

/** Which of a fleet's ships are still afloat. */
function FleetList({ fleet, shots }: { fleet: readonly Ship[]; shots: readonly Shot[] }) {
  return (
    <ul className="space-y-1 text-sm">
      {FLEET.map((length, i) => {
        const sunk = isSunk(fleet[i], shots);
        return (
          <li key={i} className={`flex justify-between gap-2 ${sunk ? "text-muted line-through" : ""}`}>
            <span className="capitalize">{SHIP_NAMES[i]}</span>
            <span className="tabular-nums">{length}</span>
            {sunk && <span className="sr-only">, sunk</span>}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Your shots at the other fleet on top, where you tap to fire, and your own
 * fleet underneath with the shots fired at it.
 */
export function SeaBoard({ state: full, you, onMove }: BoardProps<SeaState, SeaMove>) {
  // In a bot game this phone holds the whole game, so only draw what this player may see.
  const state = view(full, you);
  const me: Seat = you ?? 0;
  const them = otherSeat(me);
  const last = state.last;
  // The ship the last shot sank, in whichever fleet it was.
  const sinking = (owner: Seat) =>
    last && last.sunk !== null && last.seat !== owner ? (state.fleets[owner][last.sunk] ?? []) : [];
  const theirTitle = you === null ? "Player 2's waters" : "Their waters";
  const yourTitle = you === null ? "Player 1's waters" : "Your fleet";
  return (
    <div className="sb-board">
      <section aria-label={theirTitle}>
        <h3 className="mb-1.5 text-sm font-semibold">{theirTitle}</h3>
        <Waters
          fleet={state.fleets[them]}
          shots={state.shots[me]}
          lastShot={last?.seat === me ? last.cell : null}
          sinking={sinking(them)}
          onFire={onMove}
        />
      </section>
      <div className="mt-4 grid grid-cols-[45%_1fr] items-start gap-4">
        <section aria-label={yourTitle}>
          <h3 className="mb-1.5 text-sm font-semibold">{yourTitle}</h3>
          <Waters
            fleet={state.fleets[me]}
            shots={state.shots[them]}
            lastShot={last?.seat === them ? last.cell : null}
            sinking={sinking(me)}
            small
          />
        </section>
        <section aria-labelledby="their-ships">
          <h3 id="their-ships" className="mb-1.5 text-sm font-semibold">
            Their ships
          </h3>
          <FleetList fleet={state.fleets[them]} shots={state.shots[me]} />
        </section>
      </div>
    </div>
  );
}
