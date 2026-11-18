import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CreatorCRM — Fan Management for Creators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #1a0a15 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
            top: -100,
            right: -100,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
            bottom: -100,
            left: -50,
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: 999,
            border: "1px solid rgba(236,72,153,0.3)",
            background: "rgba(236,72,153,0.1)",
            padding: "8px 20px",
            marginBottom: 24,
          }}
        >
          <span style={{ color: "#f472b6", fontSize: 18 }}>
            The CRM built for content creators
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 16 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#ffffff" }}>
            Creator
          </span>
          <span style={{ fontSize: 72, fontWeight: 800, color: "#ec4899" }}>
            CRM
          </span>
        </div>
        <p
          style={{
            fontSize: 32,
            color: "#ffffff",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Stop losing fans you could save.
        </p>
        <p style={{ fontSize: 20, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Track fans, prevent churn, grow revenue. Free to start.
        </p>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #ec4899, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
