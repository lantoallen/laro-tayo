import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Laro Tayo!",
    short_name: "Laro Tayo",
    description: "Filipino games you can play on your phone, against a bot or with a friend.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e7",
    theme_color: "#0038a8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
