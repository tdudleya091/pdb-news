import type { NewsCategory } from "../types";

export const SECTION_PROMPT = (category: NewsCategory, newsContent: string) => `
You are an intelligence analyst preparing a President's Daily Brief section.

CATEGORY: ${category}

NEWS ITEMS TO ANALYZE:
${newsContent}

Generate a brief section with 3-5 key items. For each item provide:
1. A concise headline (max 10 words)
2. A detailed summary of 1-2 paragraphs minimum, up to 5 paragraphs maximum. IMPORTANT: Each paragraph MUST contain more than 4 sentences. Provide substantial context including:
   - Background and historical context where relevant
   - Key actors, their motivations, and relationships
   - Specific facts, figures, dates, and locations
   - Recent developments leading to this story
   - Potential implications and what to watch for
3. A "significance" statement explaining why this matters (1-2 sentences)
4. Confidence level (HIGH/MEDIUM/LOW) based on source reliability and corroboration

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
`;

export const EXECUTIVE_SUMMARY_PROMPT = (sectionsJson: string) => `
You are preparing the Executive Summary for a President's Daily Brief.

Here are today's intelligence sections:
${sectionsJson}

Write a 2-3 sentence executive summary that:
1. Highlights the most critical development of the day
2. Notes any emerging patterns or trends
3. Flags any items requiring immediate attention

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
      "sources": ["source1"],
      "confidenceLevel": "MEDIUM"
    }
  ]
}
`;
