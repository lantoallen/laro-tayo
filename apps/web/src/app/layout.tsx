import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { SunMark } from "@/components/SunMark";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Laro Tayo!",
    template: "%s | Laro Tayo!",
  },
  description: "Filipino games you can play on your phone, against a bot or with a friend.",
  applicationName: "Laro Tayo!",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#161310" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fil">
      <body className="min-h-svh antialiased">
        <header className="mx-auto flex h-14 max-w-4xl items-center px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <SunMark className="size-6" />
            Laro Tayo!
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
