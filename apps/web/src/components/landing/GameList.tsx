import Link from "next/link";

interface Game {
  name: string;
  players: string;
  description: string;
  /** Only games that are built have a link. */
  href?: string;
}

const GAMES: Game[] = [
  {
    name: "Sungka",
    players: "2 players",
    description: "The one with the long wooden board, 16 holes, and 98 shells.",
    href: "/sungka",
  },
  {
    name: "Pusoy Dos",
    players: "4 players",
    description: "A card game where you race to get rid of your cards. Bots take any empty seats.",
  },
  {
    name: "Hulaan Mo",
    players: "2 to 8 players",
    description: "One player sees the word. Everyone else asks yes-or-no questions to guess it.",
  },
];

export function GameList() {
  return (
    <section aria-labelledby="games-heading" className="py-10">
      <h2 id="games-heading" className="mb-3 text-2xl font-bold">
        Games
      </h2>
      <ul className="divide-y divide-line border-y border-line">
        {GAMES.map((game) => (
          <li key={game.name} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h3 className="font-bold">
                {game.name} <span className="font-normal text-muted">· {game.players}</span>
              </h3>
              <p className="mt-0.5 text-muted">{game.description}</p>
            </div>
            {game.href ? (
              <Link
                href={game.href}
                className="self-start rounded-lg bg-blue px-4 py-2 font-semibold text-blue-ink sm:self-center"
              >
                Play
              </Link>
            ) : (
              <span className="text-sm text-muted sm:w-24 sm:text-right">In the works</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
