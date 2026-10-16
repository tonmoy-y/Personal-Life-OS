import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2f7d79" }}>
        <svg width={112} height={112} viewBox="0 0 32 32"><path d="M9 22.5V9.5h3.6v9.8H20v3.2H9Z" fill="#fff" /><circle cx="22.4" cy="10.4" r="2.6" fill="#fff" opacity="0.75" /></svg>
      </div>
    ),
    size,
  );
}
