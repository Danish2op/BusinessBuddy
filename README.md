# BusinessBuddy

**Autonomous competitor monitoring for founders.**

BusinessBuddy maps your company moat, discovers real competitors, watches the market, and turns competitor moves into a War-Room feed, advisor chat, and branded email briefs.

[Live Demo](https://project-y550t.vercel.app) · [Custom Domain](https://businessbuddy.danis.live) · [Repository](https://github.com/Danish2op/BusinessBuddy)

> Status: MVP live on Vercel. Custom domain is linked in Vercel and waits on DNS: `A businessbuddy -> 76.76.21.21`.

## What It Does

Most founders do competitor research only when they remember to. BusinessBuddy makes it continuous.

- **Onboard a company** with moat, niche, audience, market, keywords, and business model.
- **AI discovers competitors** with Tavily search + Gemini filtering.
- **User reviews rivals** before monitoring, so random articles do not become competitors.
- **War-Room dashboard** shows radar, feed, advisor chat, monitoring control, and manual competitor add.
- **Monitoring agent** scans competitors for pricing, product, hiring, and news signals.
- **Email agent** sends formatted HTML briefs with impact and suggested action.
- **Stop button** pauses monitoring so AI/search/email credits are not wasted.

## MVP

This MVP proves the full lifecycle:

```text
Signup -> Company setup -> AI competitor suggestions -> Accept/reject
       -> Dashboard -> Monitoring -> Feed -> Email brief -> Advisor chat
```

Built MVP modules:

- Email/password auth with Supabase
- Company setup wizard
- AI strategic profile generation
- Competitor suggestions and manual competitor add
- Competitor website scraping and knowledge blocks
- Dashboard with Overview, Advisor, Feed, Competitors
- Tavily + Gemini monitoring workflow
- Report dedupe with stable signal hashes
- Resend automated alert emails
- Manual "mail this to me" feed emails
- Vercel Cron protected by `CRON_SECRET`
- RLS-backed multi-user data isolation

## Tech Stack

| Area | Stack |
| --- | --- |
| Frontend | Next.js 14 App Router, React, Tailwind CSS, Lucide |
| Auth | Supabase Auth |
| Database | Supabase Postgres + RLS |
| AI | Google Gemini |
| Search | Tavily API |
| Email | Resend |
| Deploy | Vercel |
| Jobs | Vercel Cron |
| Tests | Vitest + TypeScript |

## Product Screens

```text
Auth           -> premium dark login/signup
Setup          -> moat + audience + market form
Competitor     -> accept/reject AI rivals, add manual rivals
Dashboard      -> command-center overview
Feed           -> signal timeline + mail this to me
Advisor        -> strategy chat with report context
```

## Architecture

```text
Next.js App
  |
  |-- Supabase Auth
  |-- Supabase Postgres
  |     |-- profiles
  |     |-- companies
  |     |-- competitor_suggestions
  |     |-- competitors
  |     |-- intelligence_reports
  |     |-- advisor_messages
  |
  |-- Gemini
  |     |-- strategic profile
  |     |-- competitor filtering
  |     |-- advisor answers
  |
  |-- Tavily
  |     |-- competitor discovery
  |     |-- monitoring searches
  |
  |-- Resend
        |-- automated alerts
        |-- manual feed briefs
```

## Key Routes

| Route | Purpose |
| --- | --- |
| `/auth` | Login/signup |
| `/setup` | Company setup and competitor review |
| `/dashboard` | War-Room dashboard |
| `/api/onboarding` | Company profile + competitor discovery |
| `/api/onboarding/finalize` | Accept/reject competitor suggestions |
| `/api/competitors` | Manual competitor add |
| `/api/advisor/chat` | Strategy advisor |
| `/api/monitoring` | Toggle monitoring and run first scan |
| `/api/cron/hunt` | Daily hunt agent |
| `/api/reports/[reportId]/email` | Email one feed item to owner |

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required env keys:

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
NEXT_PUBLIC_APP_ENV=
APP_ENV=
```

Run checks:

```bash
npm test
npm run lint
npm run build
```

## Security

- Supabase RLS protects user-owned companies, competitors, reports, and advisor messages.
- API routes check Supabase sessions.
- Cron requires `CRON_SECRET`.
- Service role key stays server-only.
- Monitoring can be turned off to stop AI/search/email spend.
- Manual feed email route verifies the signed-in user owns the report before sending.

## Current Result

BusinessBuddy is a working SaaS MVP that demonstrates the core idea:

**AI should not only answer business questions. It should monitor the battlefield and warn you before you ask.**

