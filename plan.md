# AI Employee Challenge Feedback Form + Admin Dashboard

**Brand:** AI Savvy Founders
**Stack:** Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, RLS) + Tailwind + Framer Motion
**Goal:** Turn the 2-minute feedback form into an interactive experience where every answer "hires" or "unlocks" something, and the Google Maps Lead Scraper access ($50 value) is the reward at the end. Admin dashboard to read, filter and act on the responses.

---

## 1. Experience concept

Not a quiz. The form is framed as **"Performance review for your AI Employee"** and the scraper is a lock that opens as they progress.

**Core mechanics**
- One question per screen, full-bleed, keyboard and swipe friendly.
- A persistent **lock meter** at the top: a padlock that fills as they answer. At 100% it opens with a short animation.
- Answers are tactile cards, not radio buttons. Selecting a card triggers a small micro-animation and auto-advances after ~400ms.
- The free-text questions feel like writing, not filling in a field.
- Total time target: under 2 minutes. Q5 and Q6 are the only typed answers.

**Screen by screen**

| # | Screen | Interaction |
|---|--------|-------------|
| 0 | Welcome | Headline: "Tell us how it went. Unlock the Google Maps Lead Scraper ($50)." Line under it: "Your feedback does not need to be positive." Single button: "Start". Locked padlock animates in. |
| 1 | Name, email, business name | Three fields appear one at a time, like a chat. Each confirmed field slides up into a small "badge" at the top. Email validated inline. |
| 2 | Q1: How were you using AI before? | **Ladder.** 5 steps, vertical, tap the rung that matches. Rungs light up from bottom to selected one. Rung 1 "barely using AI" to rung 5 "experimenting with agents/workflows". |
| 3 | Q2: Where do you want AI to help? | **Job board.** 7 role cards + "Other" (opens inline text input). Copy: "Which role are you hiring for first?" Cards get a "Hiring" stamp on select. |
| 4 | Q3: Experience after the challenge | 6 large statement cards. Selected card lifts, others dim. |
| 5 | Q4: What is stopping you? | **Blocker cards** with a subtle "wall" visual. Selected blocker cracks or fades out. |
| 6 | Q5: Your experience, in your words | Big textarea, placeholder "Say it like you would to another business owner." Optional voice-to-text button (Web Speech API, progressive enhancement). Soft character counter, no hard minimum beyond 10 characters. |
| 7 | Q6: The ONE AI system | Framed as a **job description**: header "Job title: ______", textarea for the task. Live preview card on the right/below rebuilds their text into a posting format ("AI Employee wanted: ..."). |
| 8 | Permission | Three choices: Yes, use my name / Yes, keep me anonymous / No, keep it private. |
| 9 | Submit + Unlock | Button: "Submit & Get Free Access to the Google Maps Lead Scraper". On success the padlock opens, confetti, access link revealed, plus email sent. |

**Design notes**
- Follow the AI Savvy Founders brand palette and typography from the existing design system. Confirm tokens with the brand skill before building.
- Dark, high contrast, one accent color for selections.
- Motion budget: Framer Motion for transitions, no heavy Lottie files.
- Mobile first. Most submissions will come from a phone after an email or DM link.
- Respect `prefers-reduced-motion`.
- No em dashes anywhere in the copy.

---

## 2. Data model (Supabase)

```sql
create table feedback_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- contact
  name text not null,
  email text not null,
  business_name text not null,

  -- answers
  q1_prior_ai_use text not null check (q1_prior_ai_use in (
    'barely_using','chat_content','regular_manual','basic_automations','experimenting_agents')),
  q2_focus_area text not null check (q2_focus_area in (
    'lead_gen','sales_followup','content_branding','onboarding_delivery',
    'operations_admin','customer_support','reporting_decisions','other')),
  q2_other_text text,
  q3_experience text not null check (q3_experience in (
    'understand_ai_in_business','new_use_cases','started_building',
    'more_confident','need_help_implementing','no_change')),
  q4_blocker text not null check (q4_blocker in (
    'what_to_automate','dont_know_how','technical_setup','no_time',
    'unreliable','want_done_for_me','nothing_major')),
  q5_experience_text text not null,
  q6_dream_system text not null,
  q6_job_title text,

  -- permission
  testimonial_permission text not null check (testimonial_permission in (
    'named','anonymous','no')),

  -- ops
  reward_status text not null default 'pending'
    check (reward_status in ('pending','sent','failed')),
  reward_sent_at timestamptz,
  lead_status text not null default 'new'
    check (lead_status in ('new','contacted','call_booked','won','not_a_fit')),
  admin_notes text,
  starred boolean not null default false,
  source text,               -- utm_source or ?src= param
  user_agent text,
  submission_ms integer      -- time taken, for quality checks
);

create unique index feedback_email_unique on feedback_responses (lower(email));
create index feedback_created_idx on feedback_responses (created_at desc);
create index feedback_q4_idx on feedback_responses (q4_blocker);
create index feedback_lead_status_idx on feedback_responses (lead_status);

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null
);
```

**Optional:** `feedback_drafts` table (session id, partial answers, last step) to see where people drop off. Lets the dashboard show a funnel. Add in phase 4.

**RLS**
- `feedback_responses`: RLS enabled. No public select, update or delete.
- Public inserts do **not** go direct from the browser. They go through a Next.js route handler using the service role key, so we can validate, rate limit and dedupe.
- Admin read/update policy: allowed only when `auth.uid()` exists in `admin_users`.
- `admin_users` is managed manually in the Supabase dashboard.

---

## 3. App structure

```
/app
  /(public)
    page.tsx                  # welcome + form shell
    /thank-you/page.tsx       # fallback unlock page (if JS state lost)
  /admin
    layout.tsx                # auth guard
    login/page.tsx
    page.tsx                  # overview
    responses/page.tsx        # table
    responses/[id]/page.tsx   # detail (or drawer)
    insights/page.tsx         # free-text themes
  /api
    /submit/route.ts          # validate, insert, trigger email
    /admin/export/route.ts    # CSV export
    /admin/reward/route.ts    # resend access email
/components
  /form
    FormShell.tsx             # step state machine + progress lock
    LockMeter.tsx
    steps/ (Welcome, Contact, Ladder, JobBoard, StatementCards, Blockers, StoryText, JobDescription, Permission, Unlock)
  /admin
    StatCard.tsx, DistributionChart.tsx, ResponsesTable.tsx, FilterBar.tsx, DetailDrawer.tsx, ThemeList.tsx
/lib
  supabase/ (server.ts, client.ts, admin.ts)
  schema.ts                   # zod schemas shared by client + server
  options.ts                  # option keys and labels, single source of truth
  email.ts                    # reward email
```

**Key decisions**
- `options.ts` holds every answer key and label so the form, the DB check constraints and the dashboard charts never drift.
- Zod validates on the client and again in `/api/submit`.
- Form state lives in a `useReducer` plus `sessionStorage` so a refresh does not lose progress.
- Server actions or route handler? Use a **route handler** for submit so we can return structured errors and rate limit by IP.

---

## 4. Submission and reward flow

1. User finishes step 9 and hits submit.
2. Client POSTs to `/api/submit` with answers, `src` param and elapsed time.
3. Server: honeypot field check, zod validation, IP rate limit (e.g. 5 per hour via Upstash or a simple Supabase table), duplicate email check.
4. Insert row with the service role client.
5. Send the reward email (Resend) containing the Google Maps Lead Scraper access link. Update `reward_status` to `sent` or `failed`.
6. Return success. Client plays the unlock animation and shows the access link on screen too, so nothing depends on the email landing.
7. **Duplicate email:** show a friendly message "You already claimed this" with the access link resent instead of an error.

**Open decision:** how is scraper access delivered? Options: (a) a private link or gated page on aisavvyfounders.com, (b) a GHL tag or workflow that grants access, (c) a unique code per user. Recommend (b) or (c) so access can be tracked and revoked. If GHL, the submit handler also creates or updates the contact and applies a tag, which plugs into the existing marketing automation stack.

---

## 5. Admin dashboard

**Auth:** Supabase Auth with email magic link or Google. Middleware checks the session, then checks `admin_users`. Everything under `/admin` is `noindex`.

### 5.1 Overview (`/admin`)
- **Stat cards:** total responses, responses last 7 days, % permission to use feedback, % who want done-for-me help (Q4 = `want_done_for_me` or `no_time`), reward emails failed.
- **Responses over time** line chart.
- **Distribution charts** for Q1, Q2, Q3, Q4 (horizontal bars, click a bar to jump to a filtered table).
- **Hot leads panel:** responses where Q4 is `want_done_for_me`, `no_time` or `technical_setup`, and lead status is `new`. This is the sales list.
- **Testimonial bank panel:** latest Q5 answers with permission = `named` or `anonymous`.

### 5.2 Responses table (`/admin/responses`)
- Columns: date, name, business, Q2 focus, Q4 blocker, Q3 experience, permission, lead status, star.
- Filters: date range, any answer field, permission, lead status, starred, has "Other" text.
- Search across name, email, business, and free text.
- Sort, pagination (server side), saved views ("Hot leads", "Testimonials", "Unhappy").
- Bulk actions: set lead status, star, export selected.
- **CSV export** of current filtered view.

### 5.3 Detail drawer
- Full answers with readable labels, Q5 and Q6 displayed large.
- Editable: lead status, admin notes, star.
- Buttons: copy email, "Resend access email", "Copy as testimonial" (formats quote + name + business, respects permission choice, disabled when permission is `no`).
- Q6 shown next to a "Suggested system" notes field so it doubles as a scoping note for a build offer.

### 5.4 Insights (`/admin/insights`)
- Free-text list for Q5 and Q6 with tag chips (manual tags first).
- Phase 5 extra: an "Analyze" button that sends Q5 and Q6 text to Claude via the API and returns themes, common complaints, and top requested systems. Cache results in an `insights` table so it is not re-run on every load.
- Cross-tab view: Q4 blocker by Q2 focus area, to see what to offer next.

---

## 6. Security and quality

- Service role key server-side only. Never in client bundles.
- Honeypot field plus timing check (reject if submitted in under ~15 seconds, flag rather than drop).
- Rate limiting on `/api/submit`.
- Email normalisation (trim, lowercase), disposable domain check optional.
- Admin routes protected in middleware and again at the query level via RLS.
- Basic analytics: step views and drop-off (Plausible events or the drafts table).
- Accessibility: all cards are real buttons or radio inputs with labels, visible focus, keyboard navigation, reduced motion support.

---

## 7. Build phases

**Phase 1: Foundation (0.5 day)**
Next.js project, Tailwind, Supabase project, schema and RLS, `options.ts`, zod schemas, env setup.

**Phase 2: Form (1.5 days)**
Step state machine, lock meter, all 10 screens with interactions, validation, sessionStorage persistence, mobile pass.

**Phase 3: Submit and reward (0.5 day)**
Route handler, rate limit, dedupe, reward email, unlock screen, duplicate-email path.

**Phase 4: Admin core (1.5 days)**
Auth and guard, overview stats and charts, responses table with filters, detail drawer, lead status, notes, star, CSV export.

**Phase 5: Extras (1 day)**
Drop-off tracking, testimonial copy tool, insights page with Claude analysis, GHL tag sync.

**Phase 6: Launch checklist**
Test on iOS Safari and Android Chrome, Lighthouse pass, test duplicate and failed-email paths, add first admin user, deploy to Vercel, connect a subdomain (for example `feedback.aisavvyfounders.com`), send the link to challenge participants.

---

## 8. Assumptions and open questions

1. **Permission options:** the source text just says "Permission to use your feedback". This plan uses three choices (named, anonymous, no). Confirm.
2. **Scraper delivery:** link, GHL tag, or unique code? (Section 4.)
3. **One submission per email:** enforced. Confirm this is wanted.
4. **Reward email sender:** which address and domain for Resend?
5. **Admins:** who needs dashboard access besides you (Abdur, others)?
6. **Brand tokens:** use the existing AI Savvy Founders design skill for colors and fonts, or a fresh look for this page?
7. **Voice input for Q5:** keep it or cut it for scope?

---

## 9. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
REWARD_ACCESS_URL=
ANTHROPIC_API_KEY=          # phase 5 insights only
UPSTASH_REDIS_REST_URL=     # rate limiting (optional)
UPSTASH_REDIS_REST_TOKEN=
GHL_API_KEY=                # optional tag sync
```
