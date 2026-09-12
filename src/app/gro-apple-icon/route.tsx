import { ImageResponse } from "next/og";
export function GET() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: "#6951a5",
        color: "white",
        fontSize: 110,
        fontWeight: 700,
      }}
    >
      g
    </div>,
    { width: 180, height: 180 },
  );
}
