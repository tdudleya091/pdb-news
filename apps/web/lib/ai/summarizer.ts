import Groq from "groq-sdk";
import type { NewsItem, BriefSection, NewsCategory, DailyBrief } from "../types";
import { CATEGORY_TITLES } from "../types";
import { SECTION_PROMPT, EXECUTIVE_SUMMARY_PROMPT, WATCHLIST_PROMPT } from "./prompts";
import { groupNewsByCategory } from "../news/aggregator";
import type { WeatherData } from "../types";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = "llama-3.3-70b-versatile";

export async function generateBrief(
  newsItems: NewsItem[],
  weather: WeatherData
): Promise<DailyBrief> {
  const groupedNews = groupNewsByCategory(newsItems);
  const sections: BriefSection[] = [];

  const categoriesToProcess: NewsCategory[] = [
    "TOP_STORIES",
    "GEOPOLITICAL",
    "ECONOMIC",
    "MARKETS",
    "TECHNOLOGY",
    "DOMESTIC",
    "NAVAL",
    "ASIA",
    "OSINT",
  ];

  for (const category of categoriesToProcess) {
    const items = groupedNews[category];
    if (items.length > 0) {
      try {
        const section = await generateSection(category, items);
        sections.push(section);
      } catch (error) {
        console.error(`Failed to generate ${category} section:`, error);
      }
    }
  }

  const watchlistSection = await generateWatchlist(newsItems);
  if (watchlistSection) {
    sections.push(watchlistSection);
  }

  const executiveSummary = await generateExecutiveSummary(sections);

  return {
    id: crypto.randomUUID(),
    date: new Date(),
    weather,
    executiveSummary,
    sections,
    generatedAt: new Date(),
  };
}

async function generateSection(
  category: NewsCategory,
  items: NewsItem[]
): Promise<BriefSection> {
  const newsContent = items
    .slice(0, 10)
    .map(
      (item, i) => `
[${i + 1}] ${item.title}
Source: ${item.source}
Content: ${item.description.slice(0, 500)}
URL: ${item.url}
`
    )
    .join("\n");

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: SECTION_PROMPT(category, newsContent),
      },
    ],
    temperature: 0.3,
    max_tokens: 6000,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from Groq");
  }

  try {
    const parsed = JSON.parse(content);
    return {
      title: CATEGORY_TITLES[category],
      category,
      items: parsed.items,
    };
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: CATEGORY_TITLES[category],
        category,
        items: parsed.items,
      };
    }
    throw new Error("Failed to parse section JSON");
  }
}

async function generateWatchlist(
  allNews: NewsItem[]
): Promise<BriefSection | null> {
  const recentNews = allNews
    .slice(0, 20)
    .map((item) => `- ${item.title} (${item.source})`)
    .join("\n");

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: WATCHLIST_PROMPT(recentNews),
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      title: "Watchlist",
      category: "WATCHLIST",
      items: parsed.items,
    };
  } catch (error) {
    console.error("Failed to generate watchlist:", error);
    return null;
  }
}

async function generateExecutiveSummary(
  sections: BriefSection[]
): Promise<string> {
  const sectionsJson = JSON.stringify(
    sections.map((s) => ({
      category: s.category,
      headlines: s.items.map((i) => i.headline),
    })),
    null,
    2
  );

  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "user",
        content: EXECUTIVE_SUMMARY_PROMPT(sectionsJson),
      },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return "Executive summary unavailable.";
  }

  return content.trim();
}
