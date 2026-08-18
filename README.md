# AptiQuest

A gamified aptitude practice platform. This is a real Next.js + Prisma + Postgres
codebase — not a mockup. Everything listed under "Working" below reads and
writes an actual database; nothing is hardcoded.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL ·
NextAuth (Google + email/password) · Zod

> **Heads up:** Next.js 14 reached end-of-life in October 2025 and won't get
> guaranteed security patches for newly disclosed CVEs going forward. `package.json`
> pins `14.2.35`, the final patched 14.x release covering the December 2025
> RSC advisories (CVE-2025-55182/55183/55184/66478/67779) — but for anything
> beyond a prototype, plan to migrate to Next.js 15 (Active Maintenance LTS
> until Oct 2026). The App Router code here should port with minimal changes.

## Verification status

This project was written and reviewed in a sandbox whose network policy
blocks Prisma's engine-binary CDN, so `prisma generate` and a full `next build`
couldn't be run end-to-end here. What *was* checked: `npm install` resolves
cleanly, and the app code type-checks against a stand-in Prisma type shim with
no structural errors (a few callback-parameter "implicit any" warnings showed
up only because the shim is cruder than Prisma's real generated types — they
go away once you run `prisma generate` normally). Run through the local setup
steps below on your machine or in CI before treating this as verified.

## Local setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL and NEXTAUTH_SECRET at minimum
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open http://localhost:3000, register an account, and start practicing.
A seeded admin account is also created: `admin@aptiquest.dev` / `admin1234`.

Need a free Postgres instance? [Neon](https://neon.tech) or
[Supabase](https://supabase.com) both give you a `DATABASE_URL` in under a
minute. Prisma Postgres (via the Netlify integration below) also works.

## Deploying to Netlify

1. Push this project to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project** and pick the repo.
   Netlify auto-detects Next.js; `netlify.toml` in this repo pins the
   `@netlify/plugin-nextjs` build plugin explicitly.
3. Under **Site settings → Environment variables**, add:
   - `DATABASE_URL` — your Postgres connection string
   - `NEXTAUTH_URL` — your Netlify site URL (e.g. `https://your-site.netlify.app`)
   - `NEXTAUTH_SECRET` — output of `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional, skip to launch with email/password only
4. Either install the **Prisma Postgres** extension from the Netlify integrations
   marketplace (it provisions a database and sets `DATABASE_URL` for you), or
   paste in a Neon/Supabase URL manually.
5. Before the first deploy goes live, run the migration + seed once against
   that production database from your machine:
   ```bash
   DATABASE_URL="<your prod url>" npx prisma migrate deploy
   DATABASE_URL="<your prod url>" npm run db:seed
   ```
6. Trigger a deploy.

## What's actually working (Phase 1-2, partial 3)

- Real auth: Google OAuth + email/password (bcrypt-hashed, server-side), NextAuth sessions, protected routes via middleware
- Full question engine: category → topic → question hierarchy in Postgres, filtered practice sessions (topic/difficulty/count), Speed run / Boss battle / Exam mode variants
- **Server-side scoring only** — the client never receives a correct answer or computes XP; `/api/quiz/answer` and `/api/quiz/finish` are the single source of truth
- Real XP curve (`src/lib/xp.ts`, matches the spec's L1=0/L2=100/L3=250/L4=450 progression) and levels
- Real streaks (day-boundary logic, not a fake counter)
- Topic mastery scores computed from accuracy + volume, stored in `TopicProgress`
- Mistakes review: wrong attempts are saved and re-servable as a `MISTAKES_REVIEW` quiz
- Achievements: 8 unlockable, checked server-side against aggregate attempt data (thresholds are demo-scaled — e.g. Math Machine unlocks at 15 quant questions here, not the spec's 500; bump the numbers in `src/app/api/quiz/finish/route.ts` when you have a real content volume)
- Dashboard, practice picker, leaderboard (all-time XP ranking, real rows), profile/achievements/mastery — all server components reading Postgres directly
- Daily challenge (one per day per user, tracked server-side)
- 26 seed questions across Quant/Logical/Verbal (spec asks for 130+ — see "Content" below)

## Explicitly TODO (not built — do not assume these work)

- **Onboarding diagnostic quiz** (spec §34) — registration currently drops straight to the dashboard
- **Skill tree visualization** (spec §26)
- **Weekly/monthly/college/friends leaderboard views** — only all-time XP is implemented; the `LeaderboardEntry` model exists for the rollups but nothing writes to it yet
- **Social features** (friend requests, challenges) — schema exists (`Friendship`, `Challenge`), no UI/API
- **Admin question CRUD, review queue, per-question analytics, import history** — `/admin` shows live counts only; everything else is a stub
- **Content ingestion / crawler** (spec §10-14) — schema exists (`ImportJob`, `ImportQuestion`) but no crawler code. Per the original brief's crawler-safety rules, this should only be pointed at sources you've confirmed are legally reusable, with rate-limiting and no CAPTCHA/auth bypass — worth scoping as its own follow-up rather than bolting on quickly.
- **Survival mode**, **Weakness mode UI** (the API supports `WEAKNESS` as a quiz mode already; there's no dedicated picker button yet)
- Keyboard shortcuts in the quiz runner (1-4/A-D, N for next) — present in the prototype artifact, not yet ported to this codebase
- Sound effects, light mode toggle, reduced-motion audit, full WCAG pass

## Content

Only 26 seed questions ship with this repo (13 Quant, 8 Logical, 5 Verbal).
The spec calls for 130+ and eventually a large imported bank. Add more rows
to `prisma/seed.ts`, or build out the ingestion module above, before treating
this as launch-ready content.

## Project structure

```
src/
  app/
    (app)/            authenticated routes: dashboard, practice, mistakes, leaderboard, profile, admin
    api/               quiz start/answer/finish, auth, registration
    login/ register/   auth pages
  components/          shared UI primitives, nav
  lib/                 prisma client, auth config, XP math
prisma/
  schema.prisma        full data model (see file comments for phase status)
  seed.ts               categories, topics, achievements, seed questions
```
