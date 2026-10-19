import { ONLINE_ENABLED } from "@/lib/rooms";

const WAYS = [
  {
    title: "Against a bot",
    text: "Pick easy, medium, or hard. The hard bot thinks several moves ahead before it plays.",
  },
  {
    title: "Pass and play",
    text: "Share one phone with the people next to you and take turns.",
  },
  {
    title: "Online",
    text: ONLINE_ENABLED
      ? "Make a room, send the link to friends, and play on your own phones from anywhere."
      : "In the works. You'll send a friend a link and play from anywhere.",
  },
];

export function WaysToPlay() {
  return (
    <section id="ways" aria-labelledby="ways-heading" className="scroll-mt-4 py-10">
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
