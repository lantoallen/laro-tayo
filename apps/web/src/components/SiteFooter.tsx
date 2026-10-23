import Link from "next/link";
import { InstallButton } from "./InstallButton";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-10 flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-4 py-6 text-sm text-muted">
      <span className="font-semibold text-ink">Laro Tayo!</span>
      <Link href="/games" className="hover:text-ink">
        Games
      </Link>
      <a href="https://github.com/lantoallen/laro-tayo" className="hover:text-ink">
        Code on GitHub
      </a>
      <InstallButton className="btn-small" explain={false} />
      <span className="sm:ml-auto">
        Made by{" "}
        <a href="https://lantoallen.vercel.app" className="text-ink underline underline-offset-4">
          Allen Lanto
        </a>
      </span>
    </footer>
  );
}
