export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>
          Each round, both players pick rock, paper, or scissors. Nobody sees the other&apos;s pick until both have
          picked.
        </li>
        <li>
          Rock crushes scissors, scissors cut paper, and paper covers rock. The same pick is a tie, and doesn&apos;t
          count.
        </li>
        <li>The first to win three rounds wins the match.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        Filipino kids call it Jak-en-poy and shout &quot;Jak-en-poy, hale-hale-hoy!&quot; as they throw. In pass and
        play, hand the phone over after you pick. Your pick stays hidden.
      </p>
    </>
  );
}
