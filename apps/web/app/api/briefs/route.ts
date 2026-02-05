import { NextRequest, NextResponse } from "next/server";
import { aggregateNews } from "@/lib/news/aggregator";
import { getWeatherForecast } from "@/lib/weather/forecast";
import { generateBrief } from "@/lib/ai/summarizer";
import { saveBrief, getAllBriefs, getLatestBrief } from "@/lib/db/queries";
import { sendBriefToDiscord } from "@/lib/delivery/discord";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latest = searchParams.get("latest");

  try {
    if (latest === "true") {
      const brief = await getLatestBrief();
      if (!brief) {
        return NextResponse.json({ error: "No briefs found" }, { status: 404 });
      }
      return NextResponse.json(brief);
    }

    const briefs = await getAllBriefs();
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

    const saved = await saveBrief({
      date: brief.date,
      weather: brief.weather,
      executiveSummary: brief.executiveSummary,
      sections: brief.sections,
      rawNews: news,
      generatedAt: brief.generatedAt,
    });

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
