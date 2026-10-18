import { ImageResponse } from "next/og";

export const alt = "Laro Tayo! Sungka, no board needed.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PIT = "#3d210c";

function House() {
  return <div style={{ display: "flex", width: 76, height: 76, borderRadius: 999, background: PIT }} />;
}

function Store() {
  return <div style={{ display: "flex", width: 96, height: 176, borderRadius: 999, background: PIT }} />;
}

/** The preview image shown when the link is shared, drawn as a simple Sungka board. */
export default function OpenGraphImage() {
  const houses = Array.from({ length: 7 }, (_, i) => i);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#f6f1e7",
          color: "#1f1a14",
        }}
      >
        <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#0038a8" }}>Laro Tayo!</div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, marginTop: 12 }}>
          Sungka, no board needed.
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 16,
            marginTop: 56,
            padding: 20,
            borderRadius: 999,
            background: "#a5672f",
            border: "6px solid #74441c",
          }}
        >
          <Store />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 16 }}>
              {houses.map((i) => (
                <House key={i} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {houses.map((i) => (
                <House key={i} />
              ))}
            </div>
          </div>
          <Store />
        </div>
      </div>
    ),
    size,
  );
}
