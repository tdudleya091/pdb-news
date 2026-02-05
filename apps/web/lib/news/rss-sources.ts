import type { NewsCategory } from "../types";

export const RSS_FEEDS: Record<NewsCategory, string[]> = {
  TOP_STORIES: [
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "https://feeds.washingtonpost.com/rss/national",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.theguardian.com/world/rss",
    "https://feeds.npr.org/1001/rss.xml",
  ],
  GEOPOLITICAL: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://feeds.washingtonpost.com/rss/world",
  ],
  ECONOMIC: [
    "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",
  ],
  TECHNOLOGY: [
    "https://feeds.arstechnica.com/arstechnica/technology-lab",
    "https://www.wired.com/feed/rss",
    "https://techcrunch.com/feed/",
    "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
    "https://feeds.feedburner.com/TheHackersNews",
  ],
  DOMESTIC: [
    "https://rss.nytimes.com/services/xml/rss/nyt/US.xml",
    "https://feeds.washingtonpost.com/rss/politics",
    "https://feeds.npr.org/1014/rss.xml",
  ],
  WATCHLIST: [],
  NAVAL: [
    "https://www.navalnews.com/feed/",
    "https://news.usni.org/feed",
    "https://gcaptain.com/feed/",
    "https://www.maritime-executive.com/articles.rss",
    "https://breakingdefense.com/feed/",
  ],
  ASIA: [
    "https://thediplomat.com/feed/",
    "https://asiatimes.com/feed/",
    "https://en.yna.co.kr/RSS/news.xml",
    "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml",
    "https://asia.nikkei.com/rss/feed/nar",
  ],
  OSINT: [
    "https://www.bellingcat.com/feed/",
    "https://www.thedrive.com/the-war-zone/feed",
    "https://www.defenseone.com/rss/all/",
    "https://www.sandboxx.us/feed/",
    "https://warontherocks.com/feed/",
  ],
};
