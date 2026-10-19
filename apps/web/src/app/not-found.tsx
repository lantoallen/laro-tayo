import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 pt-10 pb-16">
      <h1 className="text-2xl font-bold">This page doesn&apos;t exist</h1>
      <p className="mt-2 text-muted">The link may have a typo, or the page was moved.</p>
      <Link href="/games" className="btn btn-primary mt-6">
        Go to the games
      </Link>
    </main>
  );
}
