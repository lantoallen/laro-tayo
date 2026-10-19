export function Rules() {
  return (
    <>
      <ol className="list-decimal space-y-2 pl-5 marker:text-muted">
        <li>Split into 2 to 4 teams. Teams take turns.</li>
        <li>
          On your team&apos;s turn, one player is the guesser. They hold the phone up to their forehead with the screen
          facing the rest of the team, so everyone but them can see the word.
        </li>
        <li>
          The guesser asks yes-or-no questions. The team can only answer &quot;yes&quot;, &quot;no&quot;, or
          &quot;maybe&quot;.
        </li>
        <li>When the guesser says the word, a teammate taps Got it. Stuck? Tap Skip for a new word.</li>
        <li>Each word guessed before the timer runs out is a point. The team with the most points at the end wins.</li>
      </ol>
      <p className="mt-3 text-sm text-muted">
        It&apos;s based on Pinoy Henyo, where the answers are &quot;oo&quot;, &quot;hindi&quot;, and
        &quot;pwede&quot;.
      </p>
    </>
  );
}
