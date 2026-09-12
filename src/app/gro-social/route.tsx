import { ImageResponse } from "next/og";
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#f4f0f8",
        color: "#30283f",
        padding: "64px 76px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: -5,
          }}
        >
          gro<span style={{ color: "#6951a5", marginLeft: 8 }}>↗</span>
        </div>
        <div style={{ fontSize: 20, marginTop: 4 }}>by Fusion Ventures</div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 70,
          lineHeight: 1.08,
          letterSpacing: -3,
          maxWidth: 950,
        }}
      >
        Get a Growth Agent for your business.
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #d8cfe3",
          paddingTop: 24,
          fontSize: 24,
        }}
      >
        <span>AI-powered. Human-backed.</span>
        <span style={{ color: "#6951a5" }}>Your growth, looked after.</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
