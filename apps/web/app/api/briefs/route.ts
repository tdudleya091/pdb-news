import { NextRequest, NextResponse } from "next/server";
import { aggregateNews } from "@/lib/news/aggregator";
import { getWeatherForecast } from "@/lib/weather/forecast";
import { generateBrief } from "@/lib/ai/summarizer";
import { sendBriefToDiscord } from "@/lib/delivery/discord";

// Allow longer execution time for brief generation
export const maxDuration = 300;

// Dynamic import for database (may not be available on serverless)
async function tryGetDbQueries() {
  try {
    return await import("@/lib/db/queries");
  } catch {
    console.warn("Database not available (serverless environment)");
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latest = searchParams.get("latest");

  try {
    const db = await tryGetDbQueries();
    if (!db) {
      return NextResponse.json(
        { error: "Database not available in serverless mode" },
        { status: 503 }
      );
    }

    if (latest === "true") {
      const brief = await db.getLatestBrief();
      if (!brief) {
        return NextResponse.json({ error: "No briefs found" }, { status: 404 });
      }
      return NextResponse.json(brief);
    }

    const briefs = await db.getAllBriefs();
    return NextResponse.json(briefs);
  } catch (error) {
    console.error("Failed to fetch briefs:", error);
    return NextResponse.json(
      { error: "Failed to fetch briefs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.PDB_API_KEY;

  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [news, weather] = await Promise.all([
      aggregateNews(),
      getWeatherForecast(),
    ]);

    if (news.length === 0) {
      return NextResponse.json(
        { error: "No news items found" },
        { status: 500 }
      );
    }

    const brief = await generateBrief(news, weather);

    // Try to save to database (optional)
    let saved = brief;
    const db = await tryGetDbQueries();
    if (db) {
      try {
        saved = await db.saveBrief({
          date: brief.date,
          weather: brief.weather,
          executiveSummary: brief.executiveSummary,
          sections: brief.sections,
          rawNews: news,
          generatedAt: brief.generatedAt,
        });
      } catch (dbError) {
        console.warn("Failed to save to database:", dbError);
      }
    }

    // Send to Discord if configured
    if (process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_USER_ID) {
      sendBriefToDiscord(saved).catch((err) =>
        console.error("Discord delivery failed:", err)
      );
    }

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Failed to generate brief:", error);
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    );
  }
}
