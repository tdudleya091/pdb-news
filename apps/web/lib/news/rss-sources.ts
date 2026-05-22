import type { NewsCategory } from "../types";

export const RSS_FEEDS: Record<NewsCategory, string[]> = {
  TOP_STORIES: [
    "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://www.theguardian.com/world/rss",
    "https://feeds.npr.org/1001/rss.xml",
    "https://www.politico.eu/feed/",
  ],
  GEOPOLITICAL: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
    "https://www.aljazeera.com/xml/rss/all.xml",
    "https://www.politico.eu/feed/",
    "https://foreignpolicy.com/feed/",
  ],
  ECONOMIC: [
    // Wire Services - Economic Development Focus
    "https://feeds.content.dowjones.io/public/rss/mw_topstories",
    "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines",
    "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml",
    "https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml",
    "https://feeds.bbci.co.uk/news/business/rss.xml",
    // Economic Development & Policy
    "https://www.ft.com/rss/home",
    "https://feeds.bloomberg.com/economics/news.rss",
    // Development Banks & Institutions
    "https://www.adb.org/news/feed",
    "https://blogs.worldbank.org/feed",
    // Trade Publications
    "https://www.spglobal.com/marketintelligence/en/rss-feed/articles",
  ],
  MARKETS: [
    // Wire Services - Market Coverage
    "https://feeds.content.dowjones.io/public/rss/mw_marketpulse",
    "https://feeds.content.dowjones.io/public/rss/mw_bulletins",
    // Regional Markets
    "https://feeds.bloomberg.com/markets/news.rss",
    "https://www.ft.com/markets?format=rss",
    // Market Data & Analysis
    "https://www.investing.com/rss/news.rss",
    "https://seekingalpha.com/market_currents.xml",
    "https://finance.yahoo.com/rss/topstories",
    // Regional Wire Coverage - Asia
    "https://asia.nikkei.com/rss/feed/nar",
    "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
    // Europe Markets
    "https://www.ft.com/companies/europe?format=rss",
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
    "https://feeds.npr.org/1014/rss.xml",
    "https://thehill.com/feed/",
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
    "https://www3.nhk.or.jp/rss/news/cat0.xml",
    "https://www.japantimes.co.jp/feed/",
    "https://www.scmp.com/rss/91/feed",
  ],
  OSINT: [
    "https://www.bellingcat.com/feed/",
    "https://www.thedrive.com/the-war-zone/feed",
    "https://www.defenseone.com/rss/all/",
    "https://www.sandboxx.us/feed/",
    "https://warontherocks.com/feed/",
    "https://www.criticalthreats.org/feed",
  ],
};
