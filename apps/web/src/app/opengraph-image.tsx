import type { ReactNode } from "react";
import { ImageResponse } from "next/og";

export const alt = "Laro Tayo! Filipino games you can play on your phone: Sungka, Pusoy Dos, and Hulaan Mo.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PIT = "#3d210c";
const WOOD = "#a5672f";
const BLUE = "#0038a8";

function Tile({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 300,
          height: 190,
          borderRadius: 24,
          background: "#fffdf8",
          border: "3px solid #ddd3c3",
        }}
      >
        {children}
      </div>
      <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{name}</div>
    </div>
  );
}

function Pits() {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ display: "flex", width: 26, height: 26, borderRadius: 999, background: PIT }} />
      ))}
    </div>
  );
}

function Card({ label, color, turn }: { label: string; color: string; turn: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 84,
        height: 120,
        margin: "0 -6px",
        borderRadius: 12,
        background: "white",
        border: "3px solid #ddd3c3",
        transform: `rotate(${turn}deg)`,
        fontSize: 48,
        fontWeight: 700,
        color,
      }}
    >
      {label}
    </div>
  );
}

/** The preview image shown when the link is shared: the headline and a tile for each game. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          background: "#f6f1e7",
          color: "#1f1a14",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: BLUE }}>Laro Tayo!</div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 700, marginTop: 8 }}>
          Filipino games you can play on your phone.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 48 }}>
          <Tile name="Sungka">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                padding: "18px 28px",
                borderRadius: 999,
                background: WOOD,
              }}
            >
              <Pits />
              <Pits />
            </div>
          </Tile>
          <Tile name="Pusoy Dos">
            <Card label="A" color="#ce1126" turn={-10} />
            <Card label="2" color={BLUE} turn={8} />
          </Tile>
          <Tile name="Hulaan Mo">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 150,
                height: 100,
                borderRadius: 28,
                background: BLUE,
                color: "white",
                fontSize: 60,
                fontWeight: 700,
              }}
            >
              ?
            </div>
          </Tile>
        </div>
      </div>
    ),
    size,
  );
}
