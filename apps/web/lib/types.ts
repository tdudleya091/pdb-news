export interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: NewsCategory;
}

export type NewsCategory =
  | "TOP_STORIES"
  | "GEOPOLITICAL"
  | "ECONOMIC"
  | "TECHNOLOGY"
  | "DOMESTIC"
  | "WATCHLIST"
  | "NAVAL"
  | "ASIA"
  | "OSINT";

export interface WeatherData {
  location: string;
  current: {
    tempF: number;
    tempC: number;
    condition: string;
    humidity: number;
    windMph: number;
  };
  forecast: Array<{
    date: string;
    highF: number;
    lowF: number;
    highC: number;
    lowC: number;
    condition: string;
    precipChance: number;
  }>;
}

export interface DailyBrief {
  id: string;
  date: Date;
  weather: WeatherData;
  executiveSummary: string;
  sections: BriefSection[];
  generatedAt: Date;
}

export interface BriefSection {
  title: string;
  category: NewsCategory;
  items: BriefItem[];
}

export interface BriefItem {
  headline: string;
  summary: string;
  significance: string;
  sources: string[];
  confidenceLevel: "HIGH" | "MEDIUM" | "LOW";
}

export const CATEGORY_TITLES: Record<NewsCategory, string> = {
  TOP_STORIES: "Top Stories",
  GEOPOLITICAL: "Geopolitical Affairs",
  ECONOMIC: "Economic & Markets",
  TECHNOLOGY: "Technology",
  DOMESTIC: "Domestic Affairs",
  WATCHLIST: "Watchlist",
  NAVAL: "Naval & Maritime",
  ASIA: "Asia-Pacific",
  OSINT: "OSINT & Conflicts",
};
