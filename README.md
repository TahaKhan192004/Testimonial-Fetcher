# AI Employee Challenge feedback form + admin dashboard

Next.js 16 (App Router, TypeScript), Supabase (Postgres, Auth, RLS), Tailwind 4, Framer Motion. Implements `plan.md`.

Answers are stored in Supabase only. There is no email sending and no GHL sync. After submitting, the person sees a
plain link to the Google Maps Lead Scraper extension on screen (`REWARD_ACCESS_URL`), with no per-user code or gating.

## Set up

1. `npm install`
2. The migration `supabase/migrations/0001_init.sql` is already applied to the `ai-employee-challenge-portal` project.
   It only adds `feedback_*` tables and `is_feedback_admin()`, and reuses the portal's existing `admin_users`.
3. `.env.local` already has the project URL and publishable key. Add `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard, Project Settings, API keys) and `REWARD_ACCESS_URL`.
4. `npm run dev`, open http://localhost:3000. Add `?src=email` to track where people came from.

### Admins

The dashboard uses the portal's existing `admin_users` table (`id` = the Supabase auth user id). The current admin is
`teams@funnelsaviour.com`, who can sign in at `/admin/login` right away. Add `http://localhost:3000/auth/callback` and
the production URL to Supabase Auth redirect URLs. To add another admin, sign in once with their email, then:

```sql
insert into public.admin_users (id, email)
select id, email from auth.users where email = 'someone@example.com';
```

Anyone can request a magic link, but only rows in `admin_users` get past the proxy, the page guard and RLS.

## How it fits together

- `lib/options.ts` is the single source of truth for answer keys and labels. The form, zod schemas, admin charts and CSV all read it. The SQL check constraints must match it.
- Public submit goes browser to `/api/submit` (honeypot, rate limit, zod, dedupe, insert with the service role). The browser never writes to the database.
- A repeat email is not an error: the person sees "You already claimed this" and the link again. One submission per email is enforced by a unique index.
- Submissions faster than 15 seconds are stored with `flagged_reason = 'fast_submission'` rather than dropped.
- Admin reads and writes run as the signed-in user, so RLS is enforced. Admins can only update the ops columns (`lead_status`, `admin_notes`, `suggested_system`, `tags`, `starred`).
- `proxy.ts` guards `/admin` and `/api/admin`, and everything under `/admin` is `noindex`.
- Tables: `feedback_responses`, `feedback_drafts` (drop-off funnel), `feedback_insights` (cached Claude analysis, optional), `feedback_rate_limits` (fallback limiter).

## Launch checklist

- [ ] Service role key added
- [ ] `REWARD_ACCESS_URL` points at the extension link
- [ ] Test on iOS Safari and Android Chrome, and the duplicate-email path
- [ ] Set `NEXT_PUBLIC_SITE_URL`, deploy to Vercel, connect a subdomain such as `feedback.aisavvyfounders.com`
- [ ] Optional: `ANTHROPIC_API_KEY` for the Insights analysis, Upstash keys for rate limiting
