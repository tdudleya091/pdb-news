import { getAllBriefs } from "@/lib/db/queries";
import { format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function BriefsPage() {
  const briefs = await getAllBriefs();

  return (
    <div>
      <h1
        style={{
          color: "#1a365d",
          marginBottom: "2rem",
          fontSize: "1.75rem",
        }}
      >
        Brief Archive
      </h1>

      {briefs.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "8px",
            color: "#718096",
          }}
        >
          No briefs have been generated yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {briefs.map((brief) => (
            <Link
              key={brief.id}
              href={`/briefs/${brief.id}`}
              style={{
                display: "block",
                background: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                transition: "box-shadow 0.2s",
                textDecoration: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#1a365d",
                      fontSize: "1.125rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {format(new Date(brief.date), "EEEE, MMMM d, yyyy")}
                  </h2>
                  <p
                    style={{
                      color: "#4a5568",
                      fontSize: "0.9375rem",
                      lineHeight: "1.5",
                    }}
                  >
                    {brief.executiveSummary.slice(0, 200)}
                    {brief.executiveSummary.length > 200 ? "..." : ""}
                  </p>
                </div>
                <div
                  style={{
                    color: "#a0aec0",
                    fontSize: "0.75rem",
                    whiteSpace: "nowrap",
                    marginLeft: "1rem",
                  }}
                >
                  {format(new Date(brief.generatedAt), "h:mm a")}
                </div>
              </div>
              <div
                style={{
                  marginTop: "1rem",
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                {(brief.sections as { title: string }[]).map((section, i) => (
                  <span
                    key={i}
                    style={{
                      background: "#edf2f7",
                      color: "#4a5568",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {section.title}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
