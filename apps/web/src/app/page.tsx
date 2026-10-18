import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <p className="mt-4 max-w-lg text-muted">
        Mga larong Pinoy sa phone. Pwede kang kumalaban sa bot, o salitan kayo ng kalaro sa iisang phone.
      </p>

      <h1 className="mt-10 mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Mga laro</h1>
      <ul className="border-y border-line">
        <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
          <SungkaArt className="w-full max-w-56 shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-bold">Sungka</h2>
            <p className="mt-1 text-muted">
              Yung laro sa mahabang tabla na may 16 na butas at 98 na sigay. Para sa 2 players.
            </p>
          </div>
          <Link
            href="/sungka"
            className="self-start rounded-lg bg-blue px-5 py-2.5 font-semibold text-blue-ink sm:self-center"
          >
            Laruin
          </Link>
        </li>
      </ul>
      <p className="mt-4 text-sm text-muted">Ginagawa pa: Pusoy Dos at Hulaan Mo.</p>

      <footer className="mt-16 text-sm text-muted">
        Gawa ni{" "}
        <a href="https://lantoallen.vercel.app" className="text-ink underline underline-offset-4">
          Allen Lanto
        </a>
      </footer>
    </main>
  );
}

/** A small drawing of a sungka board. */
function SungkaArt({ className }: { className?: string }) {
  const houses = [0, 1, 2, 3, 4, 5, 6];
  const shells = [
    [20, 27],
    [24, 33],
    [18, 38],
    [43, 24],
    [79, 46],
    [117, 24],
    [140, 30],
  ];
  return (
    <svg viewBox="0 0 160 60" className={className} aria-hidden="true">
      <rect x="2" y="6" width="156" height="48" rx="24" fill="var(--wood)" />
      <ellipse cx="21" cy="30" rx="10" ry="17" fill="var(--pit)" />
      <ellipse cx="139" cy="30" rx="10" ry="17" fill="var(--pit)" />
      {houses.map((i) => (
        <g key={i} fill="var(--pit)">
          <circle cx={42 + i * 12.7} cy="20" r="5" />
          <circle cx={42 + i * 12.7} cy="40" r="5" />
        </g>
      ))}
      {shells.map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="2.6" ry="1.9" fill="var(--shell)" />
      ))}
    </svg>
  );
}
