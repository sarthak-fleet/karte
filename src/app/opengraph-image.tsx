import { ImageResponse } from "next/og";

/**
 * Dynamically generated OG / share-card image for the site root.
 * Next.js serves this at `/opengraph-image` and wires it into the page's
 * OpenGraph + Twitter card metadata automatically. No binary asset to ship.
 */
export const alt = "Karte — Your digital card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#10100f",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#67e8f9",
              color: "#0a0a0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            LC
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>Karte</div>
        </div>
        <div
          style={{
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.15,
            marginTop: "40px",
            maxWidth: "960px",
          }}
        >
          Your digital card on the open web.
        </div>
        <div
          style={{
            fontSize: 30,
            color: "#a1a1aa",
            marginTop: "28px",
            maxWidth: "900px",
          }}
        >
          One page, one link. Links, projects, bio, and an AI version of you.
        </div>
      </div>
    ),
    { ...size },
  );
}
