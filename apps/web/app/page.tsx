import { BriefView } from "@/components/BriefView";

export const dynamic = "force-dynamic";

async function tryGetLatestBrief() {
  try {
    const { getLatestBrief } = await import("@/lib/db/queries");
    return await getLatestBrief();
  } catch (error) {
    console.error("Failed to fetch brief from database:", error);
    return null;
  }
}

export default async function HomePage() {
  const brief = await tryGetLatestBrief();

  if (!brief) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem 2rem",
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ color: "#1a365d", marginBottom: "1rem" }}>
          No Brief Available
        </h1>
        <p style={{ color: "#718096", marginBottom: "2rem" }}>
          Your daily intelligence brief has not been generated yet.
        </p>
        <p style={{ color: "#a0aec0", fontSize: "0.875rem" }}>
          Briefs are generated automatically at 6 AM daily, or you can trigger
          one manually via the API.
        </p>
      </div>
    );
  }

  return <BriefView brief={brief} />;
}
