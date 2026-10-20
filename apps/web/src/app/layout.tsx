import type { Metadata, Viewport } from "next";
import { Bungee, Rubik } from "next/font/google";
import "./globals.css";

// Bungee is the hand-painted sign lettering. Rubik is for everything else.
const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-bungee" });
const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });

const description = "Filipino games and classics you can play on your phone, against a bot or with a friend.";

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
    { media: "(prefers-color-scheme: light)", color: "#fdf3d9" },
    { media: "(prefers-color-scheme: dark)", color: "#15120d" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bungee.variable} ${rubik.variable}`}>
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
