export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Two to four players start on the corners of a raft of tiles floating on the water.</li>
        <li>On your turn, step onto one of the tiles next to you. Nobody can share a tile.</li>
        <li>
          The first step onto a tile cracks it. The second time someone steps onto it, it sinks as soon as they step
          off. Your starting tile is already cracked.
        </li>
        <li>
          If it&apos;s your turn and there&apos;s nowhere to step, your tile sinks with you on it and you&apos;re out.
        </li>
        <li>The last one standing wins.</li>
      </ol>
      <h3 className="mt-4 font-bold">All at once</h3>
      <ol className="mt-2 list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Instead of taking turns, everyone picks a tile next to them in secret. You have 10 seconds.</li>
        <li>Then all the pieces move together. Anyone who doesn&apos;t pick in time steps somewhere at random.</li>
        <li>
          If two or more players pick the same tile, they bump into each other and stay where they are. The tile they
          all wanted cracks from the knock, and a tile that was already cracked sinks.
        </li>
        <li>Anyone left with nowhere to step falls in. If the last players fall in together, they share the win.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Watch the cracks. Stepping onto a cracked tile sinks it behind you, which can cut off a path for you as easily
        as for anyone else. With more than two players the raft is bigger.
      </p>
    </>
  );
}
