import { ImageResponse } from "next/og";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#2f7d79", borderRadius: size * 0.22 }}>
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32"><path d="M9 22.5V9.5h3.6v9.8H20v3.2H9Z" fill="#fff" /><circle cx="22.4" cy="10.4" r="2.6" fill="#fff" opacity="0.75" /></svg>
      </div>
    ),
    { width: size, height: size },
  );
}
