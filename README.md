# PDB News - Personal Daily Brief

A "President's Daily Brief" style news app that aggregates news, uses AI to generate intelligence-style summaries, and delivers via web, CLI, email, and Discord DM.

## Features

- **Weather Forecast** - Current conditions and 3-day outlook in °F and °C
- **AI-Generated Briefs** - Llama 3.3 70B (via Groq) summarizes news into PDB-style sections
- **Multiple Delivery Channels** - Web dashboard, CLI, email, and Discord DM
- **Automatic Scheduling** - Daily briefs generated via Vercel cron

## Quick Start

### 1. Install Dependencies

```bash
cd ~/projects/pdb-news
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```bash
# Required (FREE - get key at https://console.groq.com)
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=your_supabase_connection_string

# Email (optional)
RESEND_API_KEY=your_resend_key
USER_EMAIL=your@email.com

# Discord DM (optional)
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_USER_ID=target_user_id

# Weather (optional)
OPENWEATHER_API_KEY=your_openweather_key
WEATHER_LOCATION=New York,US

# Security
CRON_SECRET=random_secret_string
PDB_API_KEY=random_api_key
```

### 3. Set Up Database

Create tables in Supabase or run migrations:

```bash
cd apps/web
npx drizzle-kit push
```

### 4. Run Development Server

```bash
npm run dev
```


## CLI Usage

```bash
# View today's brief
npx tsx packages/cli/src/index.ts today

# View brief history
npx tsx packages/cli/src/index.ts history

# Generate a new brief (requires PDB_API_KEY)
PDB_API_KEY=your_key npx tsx packages/cli/src/index.ts generate
```

After building (`npm run build` in packages/cli), you can link globally:

```bash
cd packages/cli
npm link
pdb today
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/briefs` | GET | List all briefs |
| `/api/briefs` | POST | Generate new brief (requires auth) |
| `/api/briefs/today` | GET | Get today's or latest brief |
| `/api/briefs/[id]` | GET | Get specific brief |
| `/api/cron/daily` | GET | Cron endpoint (requires CRON_SECRET) |

## Discord Bot Setup

To receive DMs, create a Discord bot:

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Go to Bot tab, click "Add Bot"
4. Copy the token to `DISCORD_BOT_TOKEN`
5. Enable "Message Content Intent" under Privileged Intents
6. Go to OAuth2 > URL Generator
7. Select scopes: `bot`
8. Select permissions: `Send Messages`
9. Copy the generated URL and add bot to your server
10. Get your user ID (Developer Mode > right-click your name > Copy ID)
11. Set `DISCORD_USER_ID` in your env

## Deployment

Deploy to Vercel for automatic cron scheduling:

```bash
vercel
```

The cron job runs daily at 6 AM EST (11 AM UTC).

## Architecture

```
pdb-news/
├── apps/web/           # Next.js web app
│   ├── app/            # App router pages & API routes
│   ├── lib/            # Core logic
│   │   ├── news/       # RSS aggregation
│   │   ├── weather/    # OpenWeatherMap integration
│   │   ├── ai/         # Groq/Llama summarization
│   │   ├── delivery/   # Email & Discord
│   │   └── db/         # Drizzle ORM
│   └── components/     # React components
└── packages/cli/       # CLI tool
```

## Cost Estimate

| Service | Free Tier | Monthly Cost |
|---------|-----------|--------------|
| Vercel | Hobby plan | $0 |
| Supabase | 500MB | $0 |
| Resend | 100 emails/day | $0 |
| Groq API | 6,000 requests/day | $0 |
| Discord | Free | $0 |
| OpenWeatherMap | 1000 calls/day | $0 |
| **Total** | | **$0/month** |
