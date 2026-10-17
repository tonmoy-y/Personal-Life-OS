import { ImageResponse } from "next/og";

export const alt = "Personal Life OS: tasks, habits, goals, notes and money in one private workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#f6f3ec 0%,#dcebe8 100%)", color: "#14161c" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width={84} height={84} viewBox="0 0 100 100">
            <defs><linearGradient id="t" x1="12" y1="0" x2="88" y2="100" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#1a9a90" /><stop offset="1" stopColor="#0a4f4a" /></linearGradient></defs>
            <rect width="100" height="100" rx="29" fill="url(#t)" />
            <circle cx="68" cy="33" r="17" fill="none" stroke="#fff" strokeOpacity="0.38" strokeWidth="2.2" />
            <path d="M33 21V65Q33 76 44 76H73" fill="none" stroke="#fff" strokeWidth="10.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="68" cy="33" r="8.5" fill="#fff" />
          </svg>
          <div style={{ fontSize: 48, fontWeight: 600 }}>Life OS</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2 }}>Run your life from one calm place.</div>
          <div style={{ fontSize: 34, color: "#3f4650" }}>Tasks, calendar, habits, goals, notes and money. Private and free.</div>
        </div>
        <div style={{ fontSize: 28, color: "#0f7f76", fontWeight: 600 }}>personallifeos.tonmoyy.dev</div>
      </div>
    ),
    size,
  );
}
