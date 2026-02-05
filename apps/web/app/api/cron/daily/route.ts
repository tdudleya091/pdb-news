import { NextRequest, NextResponse } from "next/server";
import { aggregateNews } from "@/lib/news/aggregator";
import { getWeatherForecast } from "@/lib/weather/forecast";
import { generateBrief } from "@/lib/ai/summarizer";
import { sendBriefEmail } from "@/lib/delivery/email";
import { sendBriefToDiscord } from "@/lib/delivery/discord";

export const maxDuration = 300;

// Dynamic import for database (may not be available on serverless)
async function tryGetDbQueries() {
  try {
    return await import("@/lib/db/queries");
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    console.log("Starting daily brief generation...");

    const [news, weather] = await Promise.all([
      aggregateNews(),
      getWeatherForecast(),
    ]);

    console.log(`Aggregated ${news.length} news items`);
    results.newsCount = String(news.length);

    if (news.length === 0) {
      return NextResponse.json(
        { error: "No news items found", results },
        { status: 500 }
      );
    }

    const brief = await generateBrief(news, weather);
    console.log("Brief generated successfully");

    // Try to save to database (optional)
    let savedBrief = brief;
    const db = await tryGetDbQueries();
    if (db) {
      try {
        const saved = await db.saveBrief({
          date: brief.date,
          weather: brief.weather,
          executiveSummary: brief.executiveSummary,
          sections: brief.sections,
          rawNews: news,
          generatedAt: brief.generatedAt,
        });
        savedBrief = { ...brief, id: saved.id };
        results.briefId = saved.id;
        results.database = "saved";
      } catch (dbError) {
        console.warn("Failed to save to database:", dbError);
        results.database = "unavailable";
      }
    } else {
      results.database = "unavailable";
    }

    const deliveryResults = await Promise.allSettled([
      deliverEmail(savedBrief, db),
      deliverDiscord(savedBrief, db),
    ]);

    results.email =
      deliveryResults[0].status === "fulfilled"
        ? deliveryResults[0].value
        : "failed";
    results.discord =
      deliveryResults[1].status === "fulfilled"
        ? deliveryResults[1].value
        : "failed";

    console.log("Daily brief completed:", results);

    return NextResponse.json({
      success: true,
      briefId: results.briefId || brief.id,
      results,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        error: "Failed to generate daily brief",
        message: error instanceof Error ? error.message : "Unknown error",
        results,
      },
      { status: 500 }
    );
  }
}

async function deliverEmail(
  brief: Parameters<typeof sendBriefEmail>[0],
  db: Awaited<ReturnType<typeof tryGetDbQueries>>
): Promise<string> {
  const userEmail = process.env.USER_EMAIL;

  if (!userEmail) {
    console.log("USER_EMAIL not configured, skipping email delivery");
    return "skipped";
  }

  try {
    const success = await sendBriefEmail(brief, userEmail);

    if (success) {
      if (db && brief.id) {
        await db.logDelivery(brief.id, "email", "sent").catch(() => {});
        await db.updateDeliveredVia(brief.id, "email").catch(() => {});
      }
      return "sent";
    } else {
      if (db && brief.id) {
        await db.logDelivery(brief.id, "email", "failed").catch(() => {});
      }
      return "failed";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (db && brief.id) {
      await db.logDelivery(brief.id, "email", "failed", message).catch(() => {});
    }
    return "failed";
  }
}

async function deliverDiscord(
  brief: Parameters<typeof sendBriefToDiscord>[0],
  db: Awaited<ReturnType<typeof tryGetDbQueries>>
): Promise<string> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const userId = process.env.DISCORD_USER_ID;

  if (!botToken || !userId) {
    console.log("Discord not configured, skipping Discord delivery");
    return "skipped";
  }

  try {
    const success = await sendBriefToDiscord(brief);

    if (success) {
      if (db && brief.id) {
        await db.logDelivery(brief.id, "discord", "sent").catch(() => {});
        await db.updateDeliveredVia(brief.id, "discord").catch(() => {});
      }
      return "sent";
    } else {
      if (db && brief.id) {
        await db.logDelivery(brief.id, "discord", "failed").catch(() => {});
      }
      return "failed";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (db && brief.id) {
      await db.logDelivery(brief.id, "discord", "failed", message).catch(() => {});
    }
    return "failed";
  }
}
