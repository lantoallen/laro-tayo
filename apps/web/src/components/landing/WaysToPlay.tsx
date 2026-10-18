import { ONLINE_ENABLED } from "@/lib/rooms";

const WAYS = [
  {
    title: "Against a bot",
    text: "Pick easy, medium, or hard. On hard, the bot looks several moves ahead before it plays.",
  },
  {
    title: "Pass and play",
    text: "Two players on one phone. Player 1 sits at the bottom, Player 2 at the top, and you take turns.",
  },
  {
    title: "Online",
    text: ONLINE_ENABLED
      ? "Make a room, send the link to a friend, and play on your own phones from anywhere."
      : "In the works. You'll send a friend a link and play from anywhere.",
  },
];

export function WaysToPlay() {
  return (
    <section aria-labelledby="ways-heading" className="py-10">
      <h2 id="ways-heading" className="mb-4 text-2xl font-bold">
        Who are you playing?
      </h2>
      <dl className="grid gap-6 sm:grid-cols-3">
        {WAYS.map((way) => (
          <div key={way.title}>
            <dt className="font-bold">{way.title}</dt>
            <dd className="mt-1 text-muted">{way.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
