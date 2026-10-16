import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Full-bleed square: iOS applies its own rounded mask. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <svg width={180} height={180} viewBox="0 0 100 100">
          <defs>
            <linearGradient id="t" x1="12" y1="0" x2="88" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1a9a90" /><stop offset="1" stopColor="#0a4f4a" /></linearGradient>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.3" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#t)" />
          <rect width="100" height="56" fill="url(#g)" />
          <circle cx="68" cy="33" r="17" fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="2.2" />
          <path d="M33 21V65Q33 76 44 76H73" fill="none" stroke="#fff" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="68" cy="33" r="8.5" fill="#fff" />
        </svg>
      </div>
    ),
    size,
  );
}
