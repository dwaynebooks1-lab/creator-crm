import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Log In to CreatorCRM — Fan Management Dashboard";
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
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)",
            bottom: -80,
            left: -50,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "baseline", marginBottom: 16 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#ffffff" }}>Creator</span>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#ec4899" }}>CRM</span>
        </div>
        <p style={{ fontSize: 36, color: "#ffffff", fontWeight: 600, marginBottom: 8 }}>
          Welcome back
        </p>
        <p style={{ fontSize: 22, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Log in to your fan management dashboard
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
