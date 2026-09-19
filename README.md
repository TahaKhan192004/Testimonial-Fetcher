# AI Employee Challenge feedback form + admin dashboard

Next.js 16 (App Router, TypeScript), Supabase (Postgres, Auth, RLS), Tailwind 4, Framer Motion. Implements `plan.md`.

Answers are stored in Supabase only. There is no email sending and no GHL sync. After submitting, the person sees a
plain link to the Google Maps Lead Scraper extension on screen (`REWARD_ACCESS_URL`), with no per-user code or gating.

## Set up

1. `npm install`
2. The migration `supabase/migrations/0001_init.sql` is already applied to the `ai-employee-challenge-portal` project.
   It only adds `feedback_*` tables (the portal's own tables are untouched).
3. `.env.local` already has the project URL and publishable key. Add `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard, Project Settings, API keys), `ADMIN_PASSWORD` and `REWARD_ACCESS_URL`.
4. `npm run dev`, open http://localhost:3000. Add `?src=email` to track where people came from.

### Admin

`/admin` is protected by one shared password, set as `ADMIN_PASSWORD` in `.env.local` (and in Vercel for production).
There are no accounts, magic links or redirect URLs to configure. Sign in at `/admin/login`; the session lasts 30 days
in an httpOnly cookie, and changing `ADMIN_PASSWORD` signs everyone out. Login attempts are limited to 20 per hour per IP.

## How it fits together

- `lib/options.ts` is the single source of truth for answer keys and labels. The form, zod schemas, admin charts and CSV all read it. The SQL check constraints must match it.
- Public submit goes browser to `/api/submit` (honeypot, rate limit, zod, dedupe, insert with the service role). The browser never writes to the database.
- A repeat email is not an error: the person sees "You already claimed this" and the link again. One submission per email is enforced by a unique index.
- Submissions faster than 15 seconds are stored with `flagged_reason = 'fast_submission'` rather than dropped.
- After the password check, the admin pages and API routes use the server-side service role key. Admin edits can only touch the ops columns (`lead_status`, `admin_notes`, `suggested_system`, `tags`, `starred`).
- `proxy.ts` checks the password cookie for `/admin` and `/api/admin`, and everything under `/admin` is `noindex`.
- Tables: `feedback_responses`, `feedback_drafts` (drop-off funnel), `feedback_insights` (cached Claude analysis, optional), `feedback_rate_limits` (fallback limiter).

## Launch checklist

- [ ] Service role key and `ADMIN_PASSWORD` added
- [ ] `REWARD_ACCESS_URL` points at the extension link
- [ ] Test on iOS Safari and Android Chrome, and the duplicate-email path
- [ ] Deploy to Vercel and add the domain `feedback.aisavvyfounders.com` (create the DNS record Vercel shows)
- [ ] In Vercel env vars set `NEXT_PUBLIC_SITE_URL=https://feedback.aisavvyfounders.com`, plus the same Supabase, `REWARD_ACCESS_URL` and other keys as `.env.local`
- [ ] Optional: `ANTHROPIC_API_KEY` for the Insights analysis, Upstash keys for rate limiting
