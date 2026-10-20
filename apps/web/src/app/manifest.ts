import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Laro Tayo!",
    short_name: "Laro Tayo",
    description: "Filipino games and classics you can play on your phone, against a bot or with a friend.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdf3d9",
    theme_color: "#fcd116",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
