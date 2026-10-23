import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The app icon as a PNG, for phones that install the site: "LT" in the sign
 * lettering on the yellow tile from icon.svg. With `bleed` the yellow fills the
 * whole square and the letters keep to the middle, for phones that cut the icon
 * into their own shape.
 */
export async function appIcon(size: number, { bleed = false } = {}) {
  const bungee = await readFile(join(process.cwd(), "assets/fonts/Bungee-Regular.ttf"));
  const letters = (
    <div style={{ display: "flex", fontFamily: "Bungee", fontSize: size * (bleed ? 0.34 : 0.4), color: "#0038a8" }}>
      L<span style={{ color: "#ce1126" }}>T</span>
    </div>
  );
  const tile = size * 0.8;
  const icon = bleed ? (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        background: "#fcd116",
      }}
    >
      {letters}
    </div>
  ) : (
    <div style={{ display: "flex", width: "100%", height: "100%", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: size * 0.14,
          top: size * 0.14,
          width: tile,
          height: tile,
          borderRadius: size * 0.18,
          background: "#ce1126",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: size * 0.05,
          top: size * 0.05,
          width: tile,
          height: tile,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size * 0.18,
          border: `${Math.round(size * 0.06)}px solid #1b1b1b`,
          background: "#fcd116",
        }}
      >
        {letters}
      </div>
    </div>
  );
  return new ImageResponse(icon, {
    width: size,
    height: size,
    fonts: [{ name: "Bungee", data: bungee, weight: 400, style: "normal" }],
  });
}
