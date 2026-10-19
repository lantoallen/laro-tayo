import Link from "next/link";
import { GameArt } from "@/components/games/GameArt";
import { GAMES, type GameInfo } from "@/lib/games";

/** Every game in the collection, side by side, with whether you can play it yet. */
export function GameTiles() {
  return (
    <ul aria-label="Games" className="mt-10 grid grid-cols-3 gap-2 sm:gap-4">
      {GAMES.map((game) => (
        <li key={game.id}>
          <Tile game={game} />
        </li>
      ))}
    </ul>
  );
}

function Tile({ game }: { game: GameInfo }) {
  const body = (
    <>
      <div className="grid aspect-[4/3] place-items-center rounded-lg bg-bg px-2">
        <GameArt id={game.id} className="max-h-[80%] w-full" />
      </div>
      <p className="mt-2 leading-tight font-bold">{game.name}</p>
      <p className={`text-xs sm:text-sm ${game.href ? "font-semibold text-blue" : "text-muted"}`}>
        {game.href ? "Play now" : "In the works"}
      </p>
    </>
  );
  const box = "block h-full rounded-xl border border-line bg-surface p-2 sm:p-3";
  if (!game.href) return <div className={box}>{body}</div>;
  return (
    <Link href={game.href} className={`${box} hover:border-blue`}>
      {body}
    </Link>
  );
}
