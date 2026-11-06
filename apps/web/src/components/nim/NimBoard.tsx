import { START_PILES, type NimMove, type NimState } from "@laro/games/nim";
import type { BoardProps } from "@/components/board-game/types";
import "./nim.css";

const sticks = (count: number) => (count === 1 ? "1 stick" : `${count} sticks`);

export function NimBoard({ state, onMove }: BoardProps<NimState, NimMove>) {
  return (
    <div className="nim">
      {state.piles.map((size, pile) => {
        const justTook = state.last?.pile === pile ? state.last.count : 0;
        return (
          <div
            key={pile}
            role="group"
            aria-label={`Pile ${pile + 1}: ${size === 0 ? "empty" : sticks(size)}`}
            className="nim-pile"
          >
            {Array.from({ length: START_PILES[pile] }, (_, i) => {
              if (i >= size) {
                // A stick that was taken, kept as a faint outline so the pile doesn't jump around.
                const fresh = justTook > 0 && i < size + justTook;
                return <span key={i} aria-hidden="true" className={`nim-gone ${fresh ? "nim-fresh" : ""}`} />;
              }
              const take = size - i;
              const label = `Pile ${pile + 1}, stick ${i + 1}: take ${sticks(take)}${take === size ? ", the whole pile" : ""}`;
              return onMove ? (
                <button
                  key={i}
                  type="button"
                  aria-label={label}
                  onClick={() => onMove({ pile, count: take })}
                  className="nim-stick"
                />
              ) : (
                <span key={i} role="img" aria-label={`Pile ${pile + 1}, stick ${i + 1}`} className="nim-stick" />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
