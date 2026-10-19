import type { Metadata, Viewport } from "next";
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
      <body className="min-h-svh antialiased">{children}</body>
    </html>
  );
}
