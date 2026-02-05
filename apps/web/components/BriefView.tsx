"use client";

import { format } from "date-fns";
import type { Brief } from "@/lib/db/schema";
import type { BriefSection, BriefItem, WeatherData } from "@/lib/types";

interface Props {
  brief: Brief;
}

export function BriefView({ brief }: Props) {
  const weather = brief.weather as WeatherData;
  const sections = brief.sections as BriefSection[];
  const dateStr = format(new Date(brief.date), "EEEE, MMMM d, yyyy");

  return (
    <div>
      {/* Date Header */}
      <div style={{ marginBottom: "1.5rem", color: "#718096" }}>{dateStr}</div>

      {/* Weather Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "1.5rem",
          borderRadius: "12px",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
            opacity: 0.9,
            marginBottom: "1rem",
          }}
        >
          Weather - {weather.location}
        </h2>
        <div
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            marginBottom: "0.25rem",
          }}
        >
          {weather.current.tempF}°F / {weather.current.tempC}°C
        </div>
        <div
          style={{
            fontSize: "1.125rem",
            textTransform: "capitalize",
            marginBottom: "1rem",
          }}
        >
          {weather.current.condition}
        </div>
        <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>
          Humidity: {weather.current.humidity}% · Wind: {weather.current.windMph}{" "}
          mph
        </div>

        {weather.forecast.length > 0 && (
          <div
            style={{
              marginTop: "1.25rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(255,255,255,0.3)",
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            {weather.forecast.slice(0, 4).map((day, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.875rem", opacity: 0.8 }}>
                  {format(new Date(day.date), "EEE")}
                </div>
                <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
                  {day.highF}°/{day.lowF}°F
                </div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  {day.highC}°/{day.lowC}°C
                </div>
                {day.precipChance > 0 && (
                  <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                    {day.precipChance}% rain
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Executive Summary */}
      <section
        style={{
          background: "#edf2f7",
          padding: "1.5rem",
          marginBottom: "2rem",
          borderLeft: "4px solid #1a365d",
          borderRadius: "0 8px 8px 0",
        }}
      >
        <h2
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            color: "#718096",
            letterSpacing: "1px",
            marginBottom: "0.75rem",
          }}
        >
          Executive Summary
        </h2>
        <p style={{ lineHeight: 1.7, color: "#2d3748" }}>
          {brief.executiveSummary}
        </p>
      </section>

      {/* Sections */}
      {sections.map((section, sectionIndex) => (
        <section
          key={sectionIndex}
          style={{
            marginBottom: "2.5rem",
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              color: "#1a365d",
              fontSize: "1.25rem",
              borderBottom: "2px solid #e2e8f0",
              paddingBottom: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {section.title}
          </h2>

          {section.items.map((item, itemIndex) => (
            <BriefItemView key={itemIndex} item={item} />
          ))}
        </section>
      ))}

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          color: "#a0aec0",
          fontSize: "0.875rem",
          marginTop: "2rem",
        }}
      >
        Generated at {format(new Date(brief.generatedAt), "h:mm a")}
      </div>
    </div>
  );
}

function BriefItemView({ item }: { item: BriefItem }) {
  const confidenceColor = {
    HIGH: "#48bb78",
    MEDIUM: "#ed8936",
    LOW: "#f56565",
  }[item.confidenceLevel];

  return (
    <div
      style={{
        marginBottom: "1.5rem",
        paddingLeft: "1rem",
        borderLeft: `3px solid ${confidenceColor}`,
      }}
    >
      <h3
        style={{
          fontSize: "1.0625rem",
          color: "#2d3748",
          marginBottom: "0.5rem",
        }}
      >
        {item.headline}
      </h3>
      <p style={{ color: "#4a5568", marginBottom: "0.5rem", lineHeight: 1.6 }}>
        {item.summary}
      </p>
      <p
        style={{
          color: "#718096",
          fontSize: "0.9375rem",
          fontStyle: "italic",
          marginBottom: "0.5rem",
        }}
      >
        <strong>Significance:</strong> {item.significance}
      </p>
      <div style={{ fontSize: "0.75rem", color: "#a0aec0" }}>
        Sources: {item.sources.join(", ")} · Confidence: {item.confidenceLevel}
      </div>
    </div>
  );
}
