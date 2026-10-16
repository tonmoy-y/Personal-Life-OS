import { ImageResponse } from "next/og";

export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, contentType: "image/png" },
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

/** Life OS mark. Small sizes drop the ring so the L and dot stay sharp. */
export default async function Icon({ id }: { id: Promise<string | number> }) {
  const size = Number(await id);
  const small = size <= 32;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="t" x1="12" y1="0" x2="88" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1a9a90" /><stop offset="1" stopColor="#0a4f4a" /></linearGradient>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.34" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          </defs>
          <rect width="100" height="100" rx="29" fill={small ? "#0f7f76" : "url(#t)"} />
          {!small && <rect width="100" height="56" rx="29" fill="url(#g)" />}
          {!small && <circle cx="68" cy="33" r="17" fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="2.2" />}
          <path d="M33 21V65Q33 76 44 76H73" fill="none" stroke="#fff" strokeWidth={small ? 13 : 10.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="68" cy="33" r={small ? 10.5 : 8.5} fill="#fff" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
