import { NextRequest, NextResponse } from "next/server";
import { aggregateNews } from "@/lib/news/aggregator";
import { getWeatherForecast } from "@/lib/weather/forecast";
import { generateBrief } from "@/lib/ai/summarizer";
import { saveBrief, logDelivery, updateDeliveredVia } from "@/lib/db/queries";
import { sendBriefEmail } from "@/lib/delivery/email";
import { sendBriefToDiscord, disconnectDiscord } from "@/lib/delivery/discord";

export const maxDuration = 300;

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

    const saved = await saveBrief({
      date: brief.date,
      weather: brief.weather,
      executiveSummary: brief.executiveSummary,
      sections: brief.sections,
      rawNews: news,
      generatedAt: brief.generatedAt,
    });
    results.briefId = saved.id;

    const deliveryResults = await Promise.allSettled([
      deliverEmail(saved.id, { ...brief, id: saved.id }),
      deliverDiscord(saved.id, { ...brief, id: saved.id }),
    ]);

    results.email =
      deliveryResults[0].status === "fulfilled"
        ? deliveryResults[0].value
        : "failed";
    results.discord =
      deliveryResults[1].status === "fulfilled"
        ? deliveryResults[1].value
        : "failed";

    await disconnectDiscord();

    console.log("Daily brief completed:", results);

    return NextResponse.json({
      success: true,
      briefId: saved.id,
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
  briefId: string,
  brief: Parameters<typeof sendBriefEmail>[0]
): Promise<string> {
  const userEmail = process.env.USER_EMAIL;

  if (!userEmail) {
    console.log("USER_EMAIL not configured, skipping email delivery");
    return "skipped";
  }

  try {
    const success = await sendBriefEmail(brief, userEmail);

    if (success) {
      await logDelivery(briefId, "email", "sent");
      await updateDeliveredVia(briefId, "email");
      return "sent";
    } else {
      await logDelivery(briefId, "email", "failed");
      return "failed";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logDelivery(briefId, "email", "failed", message);
    return "failed";
  }
}

async function deliverDiscord(
  briefId: string,
  brief: Parameters<typeof sendBriefToDiscord>[0]
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
      await logDelivery(briefId, "discord", "sent");
      await updateDeliveredVia(briefId, "discord");
      return "sent";
    } else {
      await logDelivery(briefId, "discord", "failed");
      return "failed";
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await logDelivery(briefId, "discord", "failed", message);
    return "failed";
  }
}
