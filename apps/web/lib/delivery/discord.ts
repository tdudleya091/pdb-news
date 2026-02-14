import { format } from "date-fns";
import type { DailyBrief, NewsCategory } from "../types";

const DISCORD_API = "https://discord.com/api/v10";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

interface SendResult {
  success: boolean;
  error?: string;
  statusCode?: number;
  retryAfter?: number;
}

function log(level: "info" | "warn" | "error", message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const prefix = `[Discord ${level.toUpperCase()}] ${timestamp}`;
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";

  if (level === "error") {
    console.error(`${prefix}: ${message}${dataStr}`);
  } else if (level === "warn") {
    console.warn(`${prefix}: ${message}${dataStr}`);
  } else {
    console.log(`${prefix}: ${message}${dataStr}`);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  context: string
): Promise<SendResult> {
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      log("info", `${context} - attempt ${attempt}/${MAX_RETRIES}`, { url });

      const response = await fetch(url, options);
      lastStatusCode = response.status;

      if (response.ok) {
        log("info", `${context} - success`, { status: response.status });
        return { success: true, statusCode: response.status };
      }

      const responseText = await response.text();
      lastError = responseText;

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("retry-after") || "5", 10);
        log("warn", `${context} - rate limited, waiting ${retryAfter}s`, {
          attempt,
          retryAfter,
          response: responseText
        });

        if (attempt < MAX_RETRIES) {
          await sleep(retryAfter * 1000);
          continue;
        }
        return { success: false, error: responseText, statusCode: 429, retryAfter };
      }

      // Don't retry client errors (4xx except 429)
      if (response.status >= 400 && response.status < 500) {
        log("error", `${context} - client error, not retrying`, {
          status: response.status,
          response: responseText
        });
        return { success: false, error: responseText, statusCode: response.status };
      }

      // Retry server errors (5xx) with exponential backoff
      if (response.status >= 500) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        log("warn", `${context} - server error, retrying in ${delay}ms`, {
          status: response.status,
          attempt,
          response: responseText
        });

        if (attempt < MAX_RETRIES) {
          await sleep(delay);
          continue;
        }
      }

      return { success: false, error: responseText, statusCode: response.status };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = errorMessage;

      log("error", `${context} - network error`, { attempt, error: errorMessage });

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        log("info", `${context} - retrying in ${delay}ms`);
        await sleep(delay);
        continue;
      }
    }
  }

  return { success: false, error: lastError, statusCode: lastStatusCode };
}

async function createDMChannel(
  userId: string,
  token: string
): Promise<{ success: boolean; channelId?: string; error?: string }> {
  const result = await fetchWithRetry(
    `${DISCORD_API}/users/@me/channels`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: userId }),
    },
    "Create DM channel"
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Need to fetch again to get the channel ID (fetchWithRetry doesn't return body)
  try {
    const response = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: userId }),
    });

    if (response.ok) {
      const channel = await response.json();
      return { success: true, channelId: channel.id };
    }

    return { success: false, error: await response.text() };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function sendMessage(
  channelId: string,
  token: string,
  embeds: DiscordEmbed[],
  context: string
): Promise<SendResult> {
  return fetchWithRetry(
    `${DISCORD_API}/channels/${channelId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds }),
    },
    context
  );
}

export async function sendBriefToDiscord(brief: DailyBrief): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const userId = process.env.DISCORD_USER_ID;

  log("info", "Starting Discord delivery", {
    briefId: brief.id,
    date: format(brief.date, "yyyy-MM-dd"),
    sectionsCount: brief.sections.length
  });

  if (!token) {
    log("error", "DISCORD_BOT_TOKEN not configured");
    return false;
  }

  if (!userId) {
    log("error", "DISCORD_USER_ID not configured");
    return false;
  }

  try {
    // Create DM channel
    log("info", "Creating DM channel", { userId });
    const channelResult = await createDMChannel(userId, token);

    if (!channelResult.success || !channelResult.channelId) {
      log("error", "Failed to create DM channel", { error: channelResult.error });
      return false;
    }

    const channelId = channelResult.channelId;
    log("info", "DM channel ready", { channelId });

    const dateStr = format(brief.date, "EEEE, MMMM d, yyyy");
    const weather = brief.weather;

    // Header + Weather + Summary
    const headerEmbeds: DiscordEmbed[] = [
      {
        title: "DAILY INTELLIGENCE BRIEF",
        description: dateStr,
        color: 0x1a365d,
        timestamp: brief.generatedAt.toISOString(),
      },
      {
        title: `Weather - ${weather.location}`,
        description:
          `**${weather.current.tempF}°F / ${weather.current.tempC}°C**\n` +
          `${capitalizeFirst(weather.current.condition)}\n` +
          `Humidity: ${weather.current.humidity}% · Wind: ${weather.current.windMph} mph`,
        color: 0x667eea,
        fields:
          weather.forecast.length > 0
            ? [
                {
                  name: "Forecast",
                  value: weather.forecast
                    .slice(0, 3)
                    .map(
                      (day) =>
                        `**${format(new Date(day.date), "EEE")}**: ${day.highF}°/${day.lowF}°F`
                    )
                    .join("\n"),
                },
              ]
            : undefined,
      },
      {
        title: "Executive Summary",
        description: brief.executiveSummary,
        color: 0x2d3748,
      },
    ];

    log("info", "Sending header embeds");
    const headerResult = await sendMessage(channelId, token, headerEmbeds, "Send header");

    if (!headerResult.success) {
      log("error", "Failed to send header embeds", { error: headerResult.error });
      return false;
    }

    // Send each section
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < brief.sections.length; i++) {
      const section = brief.sections[i];
      const fields = section.items.slice(0, 3).map((item) => ({
        name: item.headline,
        value:
          `${item.summary}\n` +
          `*${item.significance}*\n` +
          `\`${item.confidenceLevel}\` · ${item.sources.slice(0, 2).join(", ")}`,
        inline: false,
      }));

      const sectionEmbed: DiscordEmbed = {
        title: section.title,
        color: getCategoryColor(section.category),
        fields,
      };

      log("info", `Sending section ${i + 1}/${brief.sections.length}`, {
        title: section.title,
        itemCount: section.items.length
      });

      const sectionResult = await sendMessage(
        channelId,
        token,
        [sectionEmbed],
        `Send section: ${section.title}`
      );

      if (sectionResult.success) {
        successCount++;
      } else {
        failCount++;
        log("warn", `Failed to send section: ${section.title}`, { error: sectionResult.error });
      }

      // Rate limit protection
      await sleep(500);
    }

    log("info", "Discord delivery completed", {
      successCount,
      failCount,
      totalSections: brief.sections.length
    });

    // Consider success if header + at least some sections were sent
    return failCount === 0 || successCount > 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    log("error", "Discord delivery failed with exception", {
      error: errorMessage,
      stack: errorStack
    });
    return false;
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCategoryColor(category: NewsCategory | string): number {
  const colors: Record<string, number> = {
    TOP_STORIES: 0xe53e3e,
    GEOPOLITICAL: 0x3182ce,
    ECONOMIC: 0x38a169,
    TECHNOLOGY: 0x805ad5,
    DOMESTIC: 0xd69e2e,
    WATCHLIST: 0x718096,
    NAVAL: 0x0077b6,
    ASIA: 0xdc2f02,
    OSINT: 0x6c757d,
  };
  return colors[category] || 0x1a365d;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function disconnectDiscord(): Promise<void> {
  // No-op for REST API approach
}
