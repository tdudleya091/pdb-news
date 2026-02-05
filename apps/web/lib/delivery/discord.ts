import { format } from "date-fns";
import type { DailyBrief, NewsCategory } from "../types";

const DISCORD_API = "https://discord.com/api/v10";

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
}

async function sendDM(
  userId: string,
  token: string,
  embeds: DiscordEmbed[]
): Promise<boolean> {
  // Create DM channel
  const channelRes = await fetch(`${DISCORD_API}/users/@me/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ recipient_id: userId }),
  });

  if (!channelRes.ok) {
    console.error("Failed to create DM channel:", await channelRes.text());
    return false;
  }

  const channel = await channelRes.json();

  // Send message
  const messageRes = await fetch(
    `${DISCORD_API}/channels/${channel.id}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bot ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ embeds }),
    }
  );

  if (!messageRes.ok) {
    console.error("Failed to send message:", await messageRes.text());
    return false;
  }

  return true;
}

export async function sendBriefToDiscord(brief: DailyBrief): Promise<boolean> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const userId = process.env.DISCORD_USER_ID;

  if (!token || !userId) {
    console.error("Discord not configured");
    return false;
  }

  try {
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

    await sendDM(userId, token, headerEmbeds);

    // Send each section
    for (const section of brief.sections) {
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

      await sendDM(userId, token, [sectionEmbed]);
      await sleep(500);
    }

    return true;
  } catch (error) {
    console.error("Failed to send Discord DM:", error);
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
