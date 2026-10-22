import { GOAL, type PigMove, type PigState } from "@laro/games/pig";
import { Die } from "@/components/board-game/Die";
import type { BoardProps } from "@/components/board-game/types";
import "./pig.css";

const COLORS = ["red", "blue", "yellow", "green"] as const;

/** One player's progress toward the goal, with this turn's points shown ahead of what's banked. */
function ScoreBar({ seat, state }: { seat: number; state: PigState }) {
  const banked = state.scores[seat];
  const rolling = state.turn === seat ? state.turnTotal : 0;
  const percent = (points: number) => `${Math.min(100, (points / GOAL) * 100)}%`;
  return (
    <div className="pig-bar" role="img" aria-label={`${COLORS[seat]}: ${banked} of ${GOAL} points banked`}>
      <span className={`pig-fill pig-${COLORS[seat]}`} style={{ width: percent(banked) }} />
      {rolling > 0 && (
        <span className={`pig-ghost pig-${COLORS[seat]}`} style={{ left: percent(banked), width: percent(rolling) }} />
      )}
    </div>
  );
}

export function PigBoard({ state, you, onMove }: BoardProps<PigState, PigMove>) {
  const last = state.last;
  // Bars in the same order as the players' rows: everyone else, then you.
  const me = you ?? 0;
  const players = state.scores.length;
  const order = [...Array.from({ length: players - 1 }, (_, i) => (me + 1 + i) % players), me];
  const roll = last?.action === "roll" ? last.roll : null;
  return (
    <div className="pig">
      <div className="space-y-2">
        {order.map((seat) => (
          <ScoreBar key={seat} seat={seat} state={state} />
        ))}
        <p className="text-right text-xs text-muted">First to {GOAL}</p>
      </div>

      <div className="card mt-4 flex items-center justify-center gap-6 p-5">
        <Die
          value={roll}
          rollKey={state.turns}
          bust={last?.bust ?? false}
          onRoll={onMove ? () => onMove("roll") : undefined}
        />
        <div className="text-center">
          {/* A new key when it changes, so the number pops. */}
          <p key={state.turnTotal} className="stat-pop font-display text-4xl tabular-nums">
            {state.turnTotal}
          </p>
          <p className="text-sm text-muted">points this turn</p>
        </div>
      </div>

      {onMove && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onMove("hold")}
            disabled={state.turnTotal === 0}
            className="btn btn-secondary py-3.5"
          >
            Hold
          </button>
          <button type="button" onClick={() => onMove("roll")} className="btn btn-primary py-3.5">
            Roll
          </button>
        </div>
      )}
    </div>
  );
}
