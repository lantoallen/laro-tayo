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
        <li>If it&apos;s your turn and there&apos;s nowhere to step, your tile sinks with you on it and you&apos;re out.</li>
        <li>The last one standing wins.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Watch the cracks. Stepping onto a cracked tile sinks it behind you, which can cut off a path for you as easily
        as for anyone else. With more than two players the raft is bigger.
      </p>
    </>
  );
}
