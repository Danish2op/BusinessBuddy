# BusinessBuddy

BusinessBuddy is a strategic intelligence platform for founders and operators who need to know what competitors are doing before those moves become customer-facing threats.

Instead of behaving like a one-off search tool, BusinessBuddy works like a small autonomous war-room: it maps a company's moat, discovers likely competitors, monitors the market, writes concise intelligence briefs, emails important signals, and gives the founder an advisor chat with company and competitor context.

Live app: https://project-y550t.vercel.app  
Target custom domain: https://businessbuddy.danis.live

## Why It Exists

Small teams rarely lose because they missed one article. They lose because many weak signals arrive separately: a competitor changes pricing, hires for a new product line, opens a new country, launches a feature, or reframes positioning. BusinessBuddy turns those signals into a monitored feed and practical response options.

BusinessBuddy helps teams:

- Map their company, moat, audience, market, and strategic positioning.
- Discover real competitor companies instead of generic news links.
- Accept, reject, or manually add competitors before monitoring begins.
- Keep competitor knowledge blocks, logos, URLs, summaries, and risk levels organized.
- Run background hunts for pricing, product, hiring, and news signals.
- Receive formatted HTML email briefs when relevant feed items appear.
- Manually email any feed item again from the dashboard.
- Ask an advisor chat how to respond using stored company, competitor, and feed context.

## Product Flow

1. A user signs up with Supabase Auth and verifies email.
2. The setup wizard collects company details: website, LinkedIn, niche, moat, motive, target audience, target countries, keywords, and costing.
3. The onboarding agent stores the company as a draft, scrapes reachable public website text, builds a strategic profile, and uses Tavily plus Gemini to suggest competitors.
4. The user reviews suggestions, accepts real competitors, rejects bad ones, or manually adds competitors.
5. Accepted competitors become monitored radar targets.
6. The dashboard shows overview, advisor chat, feed, competitors, monitoring controls, and logout.
7. When monitoring is enabled, the hunt agent scans competitor moves, deduplicates reports, stores feed entries, and sends branded email alerts.
8. The stop button pauses monitoring so cron skips the company and avoids spending Tavily/Gemini credits.

## Core Features

### War-Room Dashboard

- Dark strategic command-center UI.
- Sidebar navigation for Overview, Advisor, Feed, and Competitors.
- Tight internal scroll regions for feed, radar, and chat.
- Competitor radar with risk status, website links, LinkedIn links, and logo support.
- Monitoring toggle with immediate feedback and first-scan behavior.
- Website intel refresh for company profile enrichment.

### Intelligence Feed

- Stores curated reports in `intelligence_reports`.
- Tracks category, risk level, source URL, source title, signal hash, and email delivery metadata.
- Dedupe uses stable `signal_hash` values so repeated cron runs do not spam duplicates.
- Every feed item has a `mail this to me` action that sends a formatted branded brief to the signed-in owner.

### Advisor Chat

- Uses recent intelligence reports, competitor knowledge, and company moat context.
- Produces strategic response options: aggressive, defensive, and pivot.
- Stores advisor messages for continuity.

### Automated Monitoring

- Vercel Cron calls `/api/cron/hunt` daily.
- Cron is protected by `CRON_SECRET`.
- Only companies with `monitoring_enabled = true` are scanned.
- Monitoring off means no Tavily/Gemini/Resend spend for that company.

### Email Alerts

- Resend sends branded HTML emails from the configured verified domain sender.
- Emails include:
  - BusinessBuddy header
  - category and risk badges
  - summary
  - impact on moat
  - suggested action
  - source CTA

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 14 App Router, React 18, Tailwind CSS, Lucide React |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL with RLS |
| AI | Google Gemini |
| Agentic search | Tavily |
| Email | Resend |
| Hosting | Vercel |
| Scheduling | Vercel Cron |
| Tests | Vitest, TypeScript compile checks |

## Architecture

```text
User
  |
  v
Next.js App Router
  |-- Auth and setup pages
  |-- War-Room dashboard
  |-- API routes
        |-- /api/onboarding
        |-- /api/onboarding/finalize
        |-- /api/competitors
        |-- /api/advisor/chat
        |-- /api/monitoring
        |-- /api/cron/hunt
        |-- /api/reports/[reportId]/email
  |
  v
Supabase
  |-- profiles
  |-- companies
  |-- competitor_suggestions
  |-- competitors
  |-- intelligence_reports
  |-- advisor_messages
  |-- agent_runs
  |
  +--> Gemini for reasoning and summaries
  +--> Tavily for search
  +--> Resend for email delivery
```

## Repository Layout

```text
src/app
  auth/                 Email/password auth and callback
  setup/                Company setup wizard
  dashboard/            Protected War-Room surface
  api/                  Agent, monitoring, email, and advisor routes

src/components
  advisor/              Advisor chat UI
  auth/                 Auth form
  dashboard/            War-Room, monitoring toggle, competitor form
  setup/                Setup form and suggestion state helpers

src/lib
  agents/               Onboarding, hunt, advisor, report delivery
  gemini/               Gemini client, JSON parsing, prompts
  tavily/               Tavily search and result normalization
  resend/               Resend email client
  supabase/             Browser, server, and admin clients
  schemas/              Input validation
  security/             Origin and route safety helpers

supabase
  schema.sql            Full schema reference
  migrations/           Production lifecycle migration
```

## Database Model

Main tables:

- `profiles`: user profile tied to Supabase Auth.
- `companies`: one primary company per user in v1, with moat, audience, setup status, monitoring flag, and AI profile.
- `competitor_suggestions`: draft AI/manual competitor candidates awaiting user review.
- `competitors`: accepted competitor targets.
- `intelligence_reports`: feed entries generated by monitoring.
- `advisor_messages`: stored advisor chat history.
- `agent_runs`: operational trace records for agent workflows.

The schema uses RLS so users can only read their own companies, suggestions, competitors, reports, and advisor messages.

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env.local`

Use `.env.example` as the key list:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
TAVILY_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_ENV=development
APP_ENV=development
```

Never commit `.env.local`.

### 3. Apply Supabase schema

Run `supabase/schema.sql` for a new database, or apply the migration in `supabase/migrations/20260621_production_lifecycle.sql` for an existing database.

### 4. Start dev server

```bash
npm run dev
```

### 5. Verify

```bash
npm test
npm run lint
npm run build
```

## Deployment

The app is deployed on Vercel.

Required production environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `TAVILY_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_ENV`
- `APP_ENV`

`vercel.json` includes a daily cron:

```json
{
  "path": "/api/cron/hunt",
  "schedule": "0 0 * * *"
}
```

## Security Notes

- Dashboard, setup, advisor, monitoring, and report email APIs require an authenticated Supabase session.
- Report email route checks that the signed-in user owns the report before sending.
- Cron route requires `CRON_SECRET`.
- Service role key is server-only.
- RLS protects tenant data at the database layer.
- Public scraping is bounded and normalized before AI summarization.
- Monitoring toggle is persisted per company to prevent unwanted AI/API spend.

## Current Status

- Production app is live on Vercel.
- Auth, onboarding, competitor review, manual competitor add, dashboard, advisor, monitoring toggle, feed emails, and manual feed email are implemented.
- Test suite currently covers schema shape, onboarding, hunt dedupe, Gemini fallback behavior, report delivery, dashboard source behavior, security origin helpers, and key API route contracts.

## Roadmap

- Add richer company logo enrichment from multiple sources.
- Add per-competitor scan frequency controls.
- Add feed filters by category and risk.
- Add exportable board-ready intelligence PDFs.
- Add team/workspace accounts beyond one primary company per user.

