# BusinessBuddy MVP Design

## Goal

BusinessBuddy is a strategic intelligence war-room for founders and operators. It moves the user from asking questions to being monitored for: the app maps a company moat, discovers competitors, scans the web for threatening moves, emails alerts, and gives response advice from stored intelligence.

## Scope

MVP includes Supabase email/password auth, a setup wizard, competitor discovery, a war-room dashboard, a cron-protected hunt agent, Resend alert emails, and advisor chat over `intelligence_reports`.

Deferred: billing, multi-workspace roles, dedicated worker queues, vector database, browser scraping, and CRM integrations.

## Architecture

The app is a Next.js 14 App Router project deployed to Vercel. Supabase handles auth and Postgres. Route handlers and server actions perform authenticated writes, call provider APIs, and keep all secrets server-side. Vercel Cron triggers the hunt route through a `CRON_SECRET` bearer token.

Core modules:

- `lib/supabase`: browser, server, and admin Supabase clients.
- `lib/gemini`: Gemini client, prompt builders, JSON parsing, and strategy synthesis.
- `lib/tavily`: Tavily search client, iterative fallback search, result normalization.
- `lib/resend`: alert email rendering and delivery.
- `lib/agents`: onboarding, hunt, and advisor orchestration.
- `lib/schemas`: Zod schemas for forms, API payloads, provider outputs, and env checks.
- `components`: shell, auth, setup, dashboard, and advisor chat UI.

## Database

The schema follows the user request while using safer names for ownership:

- `profiles`: `id`, `email`, `created_at`.
- `companies`: `id`, `user_id`, `name`, `website`, `linkedin_url`, `moat_description`, `team_details`, `industry`, `ai_generated_profile`.
- `competitors`: `id`, `company_id`, `comp_name`, `website`, `analysis_summary`, `risk_level`, `last_scanned`.
- `intelligence_reports`: `id`, `competitor_id`, `company_id`, `summary`, `source_url`, `category`, `created_at`.

RLS lets authenticated users read and mutate only rows connected to their own `profiles.id`. `intelligence_reports` writes are server-only through the Supabase service/secret key.

## Workflows

### Onboarding And Strategic Mapping

User enters company website, LinkedIn, team details, industry, and moat. Gemini converts this into a compact strategic identity JSON. Tavily searches for competitors with iterative fallback queries when initial results are empty. Gemini ranks candidates and the app stores the top five competitors.

### Continuous Hunt

`/api/cron/hunt` validates `Authorization: Bearer ${CRON_SECRET}`, loads competitors through the admin client, runs Tavily searches for updates, pricing changes, new features, hiring, and news, filters relevance against the company moat with Gemini, writes concise reports, updates competitor risk and last scan time, and sends Resend alerts for medium/high threats.

### Advisor Chat

`/api/advisor/chat` requires a Supabase session, loads the owned company plus recent intelligence reports, and asks Gemini for three strategic options: aggressive, defensive, and pivot. Responses include citations by report/source.

## UI

Visual direction is a dark tactical operations console: matte charcoal panels, muted olive, steel borders, amber warnings, red threat states, emerald safe states, compact typography, Lucide icons, and subtle radar/grid motifs. No marketing landing page is required for MVP; `/` routes users to dashboard or login.

Screens:

- `/auth`: clean login/signup panel.
- `/setup`: step-by-step company/moat wizard.
- `/dashboard`: strategic summary, radar-style competitor list, risk badges, intelligence feed, and floating advisor chat.

## Security

- Provider keys and Supabase secret key live only in `.env.local` and Vercel environment variables.
- `SUPABASE_SERVICE_ROLE_KEY` is imported only from server-only admin modules.
- Client components use only `NEXT_PUBLIC_*` variables.
- API routes check Supabase user sessions unless they are cron routes.
- Cron route checks `CRON_SECRET`.
- Gemini outputs are parsed through Zod before persistence.
- Tavily empty results trigger fallback queries instead of failing silently.

## Testing

Use Vitest for unit/route tests and Testing Library for focused UI tests. TDD is required for parser, retry, discovery, hunt, advisor, and route-protection behavior. Build verification uses `npm run lint`, `npm test`, and `npm run build`.

