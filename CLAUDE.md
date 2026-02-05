# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run dev server (web app)
npm run dev

# Type check
cd apps/web && npx tsc --noEmit
cd packages/cli && npx tsc --noEmit

# Build CLI
cd packages/cli && npm run build

# Run CLI in dev mode
npx tsx packages/cli/src/index.ts today

# Push database schema
cd apps/web && npx drizzle-kit push
```

## Architecture

This is an npm workspaces monorepo with two packages:

- **apps/web** - Next.js 14 app with App Router
- **packages/cli** - Commander.js CLI tool

### Key Data Flow

1. **Cron trigger** (`/api/cron/daily`) initiates daily brief generation
2. **News aggregation** (`lib/news/aggregator.ts`) fetches RSS feeds in parallel
3. **Weather fetch** (`lib/weather/forecast.ts`) calls OpenWeatherMap API
4. **AI summarization** (`lib/ai/summarizer.ts`) uses Groq (Llama 3.3 70B) to generate PDB-style sections
5. **Database save** (`lib/db/queries.ts`) persists brief via Drizzle ORM
6. **Delivery** (`lib/delivery/`) sends to email (Resend) and Discord (bot DM)

### Type Definitions

Core types are in `apps/web/lib/types.ts`:
- `NewsItem` - Raw news from RSS feeds
- `DailyBrief` - Complete generated brief with weather, sections
- `BriefSection` / `BriefItem` - PDB-style categorized summaries

Database schema is in `apps/web/lib/db/schema.ts` using Drizzle ORM.

### API Routes

- `GET /api/briefs` - List all briefs
- `POST /api/briefs` - Generate new brief (requires `Authorization: Bearer <PDB_API_KEY>`)
- `GET /api/briefs/today` - Get today's or latest brief
- `GET /api/briefs/[id]` - Get specific brief
- `GET /api/cron/daily` - Cron endpoint (requires `Authorization: Bearer <CRON_SECRET>`)

### Environment Variables

Required: `GROQ_API_KEY`, `DATABASE_URL`
Optional: `RESEND_API_KEY`, `USER_EMAIL`, `DISCORD_BOT_TOKEN`, `DISCORD_USER_ID`, `OPENWEATHER_API_KEY`, `WEATHER_LOCATION`
