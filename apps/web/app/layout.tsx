import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Intelligence Brief",
  description: "Your personal President's Daily Brief style news summary",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <header
            style={{
              background: "#1a365d",
              color: "white",
              padding: "1rem 2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <a
              href="/"
              style={{
                color: "white",
                fontSize: "1.25rem",
                fontWeight: "bold",
                letterSpacing: "1px",
                textDecoration: "none",
              }}
            >
              DAILY INTELLIGENCE BRIEF
            </a>
            <nav style={{ display: "flex", gap: "1.5rem" }}>
              <a
                href="/"
                style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none" }}
              >
                Today
              </a>
              <a
                href="/briefs"
                style={{ color: "rgba(255,255,255,0.9)", textDecoration: "none" }}
              >
                Archive
              </a>
            </nav>
          </header>
          <main style={{ flex: 1, padding: "2rem", maxWidth: "900px", margin: "0 auto", width: "100%" }}>
            {children}
          </main>
          <footer
            style={{
              textAlign: "center",
              padding: "1.5rem",
              color: "#718096",
              fontSize: "0.875rem",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            PDB News · Powered by Claude AI
          </footer>
        </div>
      </body>
    </html>
  );
}
