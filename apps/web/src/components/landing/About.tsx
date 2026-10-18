export function About() {
  return (
    <section aria-labelledby="about-heading" className="border-t border-line py-10">
      <h2 id="about-heading" className="mb-3 text-2xl font-bold">
        About
      </h2>
      <p className="max-w-2xl text-muted">
        Made by Allen Lanto, a Computer Science student at De La Salle Lipa. Each game&apos;s rules are kept apart
        from the app&apos;s screens and have their own tests, so adding a new game doesn&apos;t mean rewriting the
        app.
      </p>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 font-semibold">
        <li>
          <a href="https://github.com/lantoallen/laro-tayo" className="underline underline-offset-4">
            Code on GitHub
          </a>
        </li>
        <li>
          <a href="https://lantoallen.vercel.app" className="underline underline-offset-4">
            Allen&apos;s portfolio
          </a>
        </li>
      </ul>
    </section>
  );
}
