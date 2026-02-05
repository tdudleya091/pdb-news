import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { format } from "date-fns";
import type { DailyBrief } from "../types";

let discordClient: Client | null = null;

async function getDiscordClient(): Promise<Client> {
  if (discordClient?.isReady()) {
    return discordClient;
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN not configured");
  }

  discordClient = new Client({
    intents: [GatewayIntentBits.DirectMessages],
  });

  await discordClient.login(token);

  await new Promise<void>((resolve) => {
    discordClient!.once("ready", () => resolve());
  });

  return discordClient;
}

export async function sendBriefToDiscord(brief: DailyBrief): Promise<boolean> {
  const userId = process.env.DISCORD_USER_ID;
  if (!userId) {
    console.error("DISCORD_USER_ID not configured");
    return false;
  }

  try {
    const client = await getDiscordClient();
    const user = await client.users.fetch(userId);

    const dateStr = format(brief.date, "EEEE, MMMM d, yyyy");
    const weather = brief.weather;

    const headerEmbed = new EmbedBuilder()
      .setTitle("DAILY INTELLIGENCE BRIEF")
      .setDescription(dateStr)
      .setColor(0x1a365d)
      .setTimestamp(brief.generatedAt);

    const weatherEmbed = new EmbedBuilder()
      .setTitle(`Weather - ${weather.location}`)
      .setDescription(
        `**${weather.current.tempF}°F / ${weather.current.tempC}°C**\n` +
          `${capitalizeFirst(weather.current.condition)}\n` +
          `Humidity: ${weather.current.humidity}% · Wind: ${weather.current.windMph} mph`
      )
      .setColor(0x667eea);

    if (weather.forecast.length > 0) {
      const forecastText = weather.forecast
        .slice(0, 3)
        .map(
          (day) =>
            `**${format(new Date(day.date), "EEE")}**: ${day.highF}°/${day.lowF}°F (${day.highC}°/${day.lowC}°C)`
        )
        .join("\n");
      weatherEmbed.addFields({ name: "Forecast", value: forecastText });
    }

    const summaryEmbed = new EmbedBuilder()
      .setTitle("Executive Summary")
      .setDescription(brief.executiveSummary)
      .setColor(0x2d3748);

    await user.send({ embeds: [headerEmbed, weatherEmbed, summaryEmbed] });

    for (const section of brief.sections) {
      const sectionEmbed = new EmbedBuilder()
        .setTitle(section.title)
        .setColor(getCategoryColor(section.category));

      for (const item of section.items.slice(0, 3)) {
        sectionEmbed.addFields({
          name: item.headline,
          value:
            `${item.summary}\n` +
            `*${item.significance}*\n` +
            `\`${item.confidenceLevel}\` · ${item.sources.slice(0, 2).join(", ")}`,
          inline: false,
        });
      }

      await user.send({ embeds: [sectionEmbed] });

      await sleep(500);
    }

    await user.send("Your daily intelligence brief is ready.");

    return true;
  } catch (error) {
    console.error("Failed to send Discord DM:", error);
    return false;
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCategoryColor(category: string): number {
  const colors: Record<string, number> = {
    TOP_STORIES: 0xe53e3e,
    GEOPOLITICAL: 0x3182ce,
    ECONOMIC: 0x38a169,
    TECHNOLOGY: 0x805ad5,
    DOMESTIC: 0xd69e2e,
    WATCHLIST: 0x718096,
  };
  return colors[category] || 0x1a365d;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function disconnectDiscord(): Promise<void> {
  if (discordClient) {
    discordClient.destroy();
    discordClient = null;
  }
}
