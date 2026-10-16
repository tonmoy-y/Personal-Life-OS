"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0, textAlign: "center" }}>
        <main>
          <h1>Something went wrong</h1>
          <p>The app hit an unexpected error. Your data is safe.</p>
          <button onClick={reset} style={{ padding: "8px 16px", fontSize: 16 }}>Reload</button>
        </main>
      </body>
    </html>
  );
}
