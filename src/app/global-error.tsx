"use client";

// Last-resort error page (e.g. the database is unreachable while rendering the site layout).
// It replaces the root layout, so it must render <html> and <body> and cannot rely on app CSS.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="bn">
      <body style={{ margin: 0, fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif", background: "#EAF6EE", color: "#183126" }}>
        <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 16 }}>
          <div role="alert" style={{ background: "#fff", border: "1px solid #DCE8DF", borderRadius: 16, padding: "40px 28px", maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: 26, margin: 0 }}>সাময়িক সমস্যা হয়েছে</h1>
            <p style={{ color: "#64756B", lineHeight: 1.8 }}>ওয়েবসাইটটি এই মুহূর্তে তথ্য লোড করতে পারছে না। কিছুক্ষণ পর আবার চেষ্টা করুন।</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 12, background: "#168447", color: "#fff", border: 0, borderRadius: 999, padding: "12px 24px", fontSize: 16, cursor: "pointer" }}
            >
              আবার চেষ্টা করুন
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
