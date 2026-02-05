import Parser from "rss-parser";
import { RSS_FEEDS } from "./rss-sources";
import type { NewsItem, NewsCategory } from "../types";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "PDB-News/1.0",
  },
});

export async function aggregateNews(): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];
  const categories = Object.keys(RSS_FEEDS) as NewsCategory[];

  for (const category of categories) {
    const feeds = RSS_FEEDS[category];
    const categoryNews = await fetchCategoryNews(category, feeds);
    allNews.push(...categoryNews);
  }

  return deduplicateNews(allNews);
}

async function fetchCategoryNews(
  category: NewsCategory,
  feedUrls: string[]
): Promise<NewsItem[]> {
  const results: NewsItem[] = [];

  const feedPromises = feedUrls.map(async (url) => {
    try {
      const feed = await parser.parseURL(url);
      const items = feed.items.slice(0, 5).map((item) => ({
        title: item.title || "",
        description: item.contentSnippet || item.content || "",
        source: feed.title || extractDomain(url),
        url: item.link || "",
        publishedAt: new Date(item.pubDate || Date.now()),
        category,
      }));
      return items;
    } catch (error) {
      console.error(`Failed to fetch RSS feed ${url}:`, error);
      return [];
    }
  });

  const feedResults = await Promise.allSettled(feedPromises);

  for (const result of feedResults) {
    if (result.status === "fulfilled") {
      results.push(...result.value);
    }
  }

  return results;
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace("www.", "").replace("feeds.", "");
  } catch {
    return url;
  }
}

function deduplicateNews(news: NewsItem[]): NewsItem[] {
  const seen = new Map<string, NewsItem>();

  for (const item of news) {
    const key = normalizeTitle(item.title);
    const existing = seen.get(key);

    if (!existing || item.publishedAt > existing.publishedAt) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values()).sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
}

export function groupNewsByCategory(
  news: NewsItem[]
): Record<NewsCategory, NewsItem[]> {
  const grouped: Record<NewsCategory, NewsItem[]> = {
    TOP_STORIES: [],
    GEOPOLITICAL: [],
    ECONOMIC: [],
    TECHNOLOGY: [],
    DOMESTIC: [],
    WATCHLIST: [],
    NAVAL: [],
    ASIA: [],
    OSINT: [],
  };

  for (const item of news) {
    grouped[item.category].push(item);
  }

  return grouped;
}
