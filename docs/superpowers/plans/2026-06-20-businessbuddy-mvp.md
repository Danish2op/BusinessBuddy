# BusinessBuddy MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a tested Next.js MVP for BusinessBuddy competitive intelligence.

**Architecture:** Next.js App Router with Supabase auth/database, server-only Gemini/Tavily/Resend integrations, and Vercel Cron for background hunts. UI is a dark operational war-room with setup, dashboard, and advisor chat.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Lucide React, Supabase JS, Zod, Vitest, Testing Library, Gemini REST API, Tavily REST API, Resend REST API, Vercel.

---

## Task 1: Project Foundation And Secret Hygiene

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`, `.env.local`, `vercel.json`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `src/lib/env.ts`, `src/lib/env.test.ts`

- [ ] Write failing env tests for required server/client variables and `CRON_SECRET`.
- [ ] Run `npm test -- src/lib/env.test.ts`; expect missing module/failing validation.
- [ ] Scaffold configs and env validation.
- [ ] Save real secrets only in `.env.local`; put names only in `.env.example`.
- [ ] Run `npm test -- src/lib/env.test.ts`; expect pass.
- [ ] Commit: `chore: scaffold businessbuddy foundation`.

## Task 2: Supabase Schema And Clients

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/schema.test.ts`

- [ ] Write failing schema tests asserting required tables, RLS enablement, and no service key in browser client.
- [ ] Run schema tests; expect failure.
- [ ] Implement SQL schema with tables, RLS, indexes, profile trigger.
- [ ] Implement browser/server/admin Supabase clients with `server-only` in admin file.
- [ ] Run schema tests; expect pass.
- [ ] Commit: `feat: add supabase schema and clients`.

## Task 3: Provider Utilities

**Files:**
- Create: `src/lib/agents/types.ts`
- Create: `src/lib/gemini/index.ts`, `src/lib/gemini/prompts.ts`, `src/lib/gemini/json.ts`, `src/lib/gemini/json.test.ts`
- Create: `src/lib/tavily/index.ts`, `src/lib/tavily/normalize.ts`, `src/lib/tavily/normalize.test.ts`
- Create: `src/lib/resend/index.ts`
- Create: `src/lib/retry.ts`, `src/lib/retry.test.ts`

- [ ] Write failing tests for JSON fence stripping, malformed JSON fallback, Tavily normalization/deduping, and retry success/failure.
- [ ] Run targeted tests; expect failures.
- [ ] Implement provider wrappers with dependency-injected `fetch`.
- [ ] Implement iterative Tavily search fallback helper.
- [ ] Run targeted tests; expect pass.
- [ ] Commit: `feat: add ai search email utilities`.

## Task 4: Onboarding Workflow

**Files:**
- Create: `src/lib/schemas/onboarding.ts`, `src/lib/schemas/onboarding.test.ts`
- Create: `src/lib/agents/onboarding.ts`, `src/lib/agents/onboarding.test.ts`
- Create: `src/app/api/onboarding/route.ts`
- Create: `src/app/setup/page.tsx`, `src/components/setup/setup-form.tsx`

- [ ] Write failing schema and agent tests for valid onboarding, invalid URLs, fallback search, and top-five competitor output.
- [ ] Run tests; expect failures.
- [ ] Implement onboarding agent orchestration.
- [ ] Implement authenticated onboarding API route.
- [ ] Implement setup wizard UI.
- [ ] Run onboarding tests; expect pass.
- [ ] Commit: `feat: implement onboarding workflow`.

## Task 5: Dashboard And Advisor Chat

**Files:**
- Create: `src/app/auth/page.tsx`, `src/components/auth/auth-form.tsx`
- Create: `src/app/dashboard/page.tsx`, `src/components/dashboard/*`
- Create: `src/components/advisor/advisor-chat.tsx`
- Create: `src/app/api/advisor/chat/route.ts`
- Create: `src/lib/agents/advisor.ts`, `src/lib/agents/advisor.test.ts`

- [ ] Write failing advisor tests for empty message rejection, report context construction, and three-option answer shape.
- [ ] Run tests; expect failures.
- [ ] Implement advisor agent and route.
- [ ] Implement auth page, dashboard, feed, risk badges, summary, and floating chat.
- [ ] Run advisor tests; expect pass.
- [ ] Commit: `feat: add war room dashboard and advisor`.

## Task 6: Background Hunt Agent And Cron

**Files:**
- Create: `src/lib/agents/hunt.ts`, `src/lib/agents/hunt.test.ts`
- Create: `src/app/api/cron/hunt/route.ts`, `src/app/api/hunt/route.ts`

- [ ] Write failing hunt tests for cron secret rejection, fallback searches, report creation, no-results behavior, and alert threshold email.
- [ ] Run tests; expect failures.
- [ ] Implement hunt agent and cron/manual routes.
- [ ] Run hunt tests; expect pass.
- [ ] Commit: `feat: implement continuous hunt agent`.

## Task 7: Verification, GitHub, And Vercel

**Files:**
- Modify: deployment env only through Vercel, not source.

- [ ] Run `npm install` if dependencies are missing.
- [ ] Run `npm test`; expect pass.
- [ ] Run `npm run lint`; expect pass.
- [ ] Run `npm run build`; expect pass.
- [ ] Add GitHub remote `https://github.com/Danish2op/BusinessBuddy.git`.
- [ ] Push commits to repo.
- [ ] Configure Vercel env vars.
- [ ] Trigger deployment and verify URL.
- [ ] Commit any deployment metadata that is safe to commit.

