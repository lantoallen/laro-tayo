import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Laro Tayo!",
    short_name: "Laro Tayo",
    description: "Filipino games and classics you can play on your phone, against a bot or with a friend.",
    // Opened from the home screen, it goes straight to the games.
    start_url: "/games",
    scope: "/",
    display: "standalone",
    background_color: "#fdf3d9",
    theme_color: "#fcd116",
    categories: ["games"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
