import type { NewsCategory } from "../types";

export const SECTION_PROMPT = (category: NewsCategory, newsContent: string) => `
You are an intelligence analyst preparing a President's Daily Brief section.

CATEGORY: ${category}

NEWS ITEMS TO ANALYZE:
${newsContent}

Generate a brief section with 3-5 key items. For each item provide:
1. A concise headline (max 10 words)
2. A detailed summary that is EXACTLY 4-5 sentences long. Each sentence must be substantive (not filler). Cover:
   - Sentence 1: What happened - the core news event with specific facts
   - Sentence 2: Who is involved - key actors, their roles and motivations
   - Sentence 3: Context - background, recent developments, or historical relevance
   - Sentence 4: Details - specific figures, dates, locations, or additional facts
   - Sentence 5 (optional): Implications - what this could lead to or what to watch for
3. A "significance" statement explaining why this matters (EXACTLY 2 sentences)
4. Confidence level (HIGH/MEDIUM/LOW) based on source reliability and corroboration
5. MINIMUM 2 sources for each story - you MUST cite at least 2 different sources

FORMAT: Return valid JSON matching this structure exactly:
{
  "title": "Section Title",
  "category": "${category}",
  "items": [
    {
      "headline": "...",
      "summary": "...",
      "significance": "...",
      "sources": ["source1", "source2"],
      "confidenceLevel": "HIGH"
    }
  ]
}

CRITICAL REQUIREMENTS (STRICTLY ENFORCED):
- Each summary MUST be 4-5 complete sentences. Count them. If you write fewer than 4 sentences, you have failed.
- Each sentence should be 15-30 words with substantive content (no filler like "This is developing" or "More to come")
- Each significance statement MUST be exactly 2 sentences explaining why this matters
- Each story MUST cite at least 2 different sources in the sources array

GUIDELINES:
- Be concise, factual, and actionable
- Avoid speculation or editorializing
- Prioritize stories by importance and actionability
- Use active voice
- Include specific numbers and names when available

CATEGORY-SPECIFIC GUIDANCE:
${category === "NAVAL" ? `
- Focus on fleet movements, ship commissioning/decommissioning, naval exercises
- Track maritime incidents, port visits, and freedom of navigation operations
- Note changes in naval force posture and shipbuilding programs
- Include vessel names, hull numbers, and fleet designations when available` : ""}
${category === "ASIA" ? `
- Emphasize regional tensions, alliance dynamics, and diplomatic shifts
- Cover trade policy developments and economic statecraft
- Track territorial disputes in South China Sea, Taiwan Strait, Korean Peninsula
- Note bilateral/multilateral summit outcomes and defense agreements` : ""}
${category === "OSINT" ? `
- Report only verified battlefield developments with source attribution
- Track confirmed equipment losses and force deployments
- Focus on strategic shifts rather than tactical minutiae
- Avoid speculation; clearly distinguish confirmed facts from assessments
- Note when information comes from official vs. open-source channels` : ""}
${category === "ECONOMIC" ? `
- HEAVY EMPHASIS ON ECONOMIC DEVELOPMENT - prioritize stories about:
  * GDP growth, industrial output, and productivity metrics
  * Infrastructure investments and development projects
  * Job creation, employment trends, and labor market shifts
  * Business expansion, factory openings, and capital expenditure
  * Trade agreements, tariffs, and export/import developments
  * Central bank policy and interest rate decisions affecting growth
  * Government stimulus, tax policy, and fiscal measures
- Focus on actionable economic intelligence with specific figures
- Include regional and sector-specific development patterns
- Track emerging market opportunities and investment flows
- Note policy changes that could impact economic development trajectories` : ""}
${category === "MARKETS" ? `
- WIRE-BASED COVERAGE BY MARKETS - structure coverage by market region:
  * US MARKETS: NYSE, NASDAQ, S&P 500 movements and drivers
  * EUROPEAN MARKETS: FTSE, DAX, CAC40, Euro Stoxx developments
  * ASIAN MARKETS: Nikkei, Hang Seng, Shanghai Composite, KOSPI updates
  * EMERGING MARKETS: Notable movements in Brazil, India, Southeast Asia
- Report from wire services (Reuters, Bloomberg, Dow Jones) with timestamps
- Include specific index levels, percentage changes, and volume data
- Track sector rotations and institutional money flows
- Cover commodities (oil, gold, metals) and forex (major pairs, DXY)
- Note futures and pre-market indicators for forward-looking context
- Highlight market-moving events: earnings, economic data releases, Fed speak
- Emphasize cross-market correlations and spillover effects` : ""}
`;

export const EXECUTIVE_SUMMARY_PROMPT = (sectionsJson: string) => `
You are preparing the Executive Summary for a President's Daily Brief with emphasis on economic development.

Here are today's intelligence sections:
${sectionsJson}

Write a 2-3 sentence executive summary that:
1. Leads with the most critical ECONOMIC DEVELOPMENT or market-moving development if significant
2. Highlights geopolitical or security developments that may impact economic conditions
3. Notes any market patterns, trends, or items requiring immediate attention

EMPHASIS: Prioritize economic growth indicators, market movements, trade developments, and policy decisions that affect economic development. Frame geopolitical events through their economic impact lens when relevant.

Return ONLY the summary text, no JSON formatting. Be direct and actionable.
`;

export const WATCHLIST_PROMPT = (recentNews: string) => `
You are an intelligence analyst maintaining a watchlist for a President's Daily Brief.

Recent news items:
${recentNews}

Identify 2-3 developing stories that:
1. Are not yet major headlines but show potential for escalation
2. Represent ongoing situations that require monitoring
3. Could have significant implications in the coming days/weeks

Return valid JSON:
{
  "title": "Watchlist",
  "category": "WATCHLIST",
  "items": [
    {
      "headline": "...",
      "summary": "...",
      "significance": "Why this needs monitoring...",
      "sources": ["source1", "source2"],
      "confidenceLevel": "MEDIUM"
    }
  ]
}

CRITICAL REQUIREMENTS (STRICTLY ENFORCED):
- Each summary MUST be 4-5 complete sentences. Count them. If you write fewer than 4 sentences, you have failed.
- Each sentence should be 15-30 words with substantive content (no filler like "This is developing" or "More to come")
- Each significance statement MUST be exactly 2 sentences explaining why this matters
- Each story MUST cite at least 2 different sources in the sources array
`;
