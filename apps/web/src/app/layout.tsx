import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SunMark } from "@/components/SunMark";
import "./globals.css";

const description = "Filipino games you can play on your phone, against a bot or with a friend.";

export const metadata: Metadata = {
  metadataBase: new URL("https://laro-tayo.vercel.app"),
  title: {
    default: "Laro Tayo!",
    template: "%s | Laro Tayo!",
  },
  description,
  applicationName: "Laro Tayo!",
  openGraph: {
    type: "website",
    siteName: "Laro Tayo!",
    title: "Laro Tayo!",
    description,
    locale: "en_PH",
    url: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#161310" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="min-h-svh antialiased">
        <header className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <SunMark className="size-6" />
            Laro Tayo!
          </Link>
          <nav aria-label="Main">
            <Link href="/games" className="rounded-lg px-3 py-2 font-semibold hover:bg-surface">
              Games
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
