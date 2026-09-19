-- AI Employee Challenge feedback form + admin dashboard
--
-- Designed to live in the ai-employee-challenge-portal project. It is additive:
-- it creates only feedback_* tables and one function, and reuses the portal's
-- existing public.admin_users (id = auth.users.id) without altering it.

create table public.feedback_responses (
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
  lead_status text not null default 'new'
    check (lead_status in ('new','contacted','call_booked','won','not_a_fit')),
  admin_notes text,
  suggested_system text,
  tags text[] not null default '{}',
  starred boolean not null default false,
  source text,               -- utm_source or ?src= param
  user_agent text,
  submission_ms integer,     -- time taken, for quality checks
  flagged_reason text        -- e.g. fast_submission
);

create unique index feedback_email_unique on public.feedback_responses (lower(email));
create index feedback_created_idx on public.feedback_responses (created_at desc);
create index feedback_q4_idx on public.feedback_responses (q4_blocker);
create index feedback_lead_status_idx on public.feedback_responses (lead_status);

-- Drop-off tracking (one row per browser session, no answers stored)
create table public.feedback_drafts (
  session_id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  max_step integer not null default 0,
  last_step integer not null default 0,
  completed boolean not null default false,
  source text
);

-- Cached Claude analysis of the free-text answers
create table public.feedback_insights (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  response_count integer not null,
  result jsonb not null
);

-- Fallback rate limiter (used when Upstash is not configured)
create table public.feedback_rate_limits (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index feedback_rate_limits_key_idx on public.feedback_rate_limits (key, created_at desc);

-- Admin check against the portal's existing admin_users table.
-- SECURITY DEFINER so signed-in users can ask "am I an admin?" without any
-- policy on admin_users itself.
create or replace function public.is_feedback_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where id = auth.uid());
$$;
revoke all on function public.is_feedback_admin() from public, anon;
grant execute on function public.is_feedback_admin() to authenticated;

-- RLS
alter table public.feedback_responses enable row level security;
alter table public.feedback_drafts enable row level security;
alter table public.feedback_insights enable row level security;
alter table public.feedback_rate_limits enable row level security;

-- No public select, insert, update or delete. Public inserts go through the
-- Next.js route handler with the service role key.
revoke all on public.feedback_responses, public.feedback_drafts,
  public.feedback_insights, public.feedback_rate_limits from anon;
revoke all on public.feedback_rate_limits from authenticated;

create policy "admins read responses" on public.feedback_responses
  for select to authenticated using (public.is_feedback_admin());
create policy "admins update responses" on public.feedback_responses
  for update to authenticated
  using (public.is_feedback_admin()) with check (public.is_feedback_admin());

-- Admins may only change the operational columns, never the submitted answers
revoke update on public.feedback_responses from authenticated;
grant update (lead_status, admin_notes, suggested_system, tags, starred)
  on public.feedback_responses to authenticated;
revoke insert, delete on public.feedback_responses from authenticated;

create policy "admins read drafts" on public.feedback_drafts
  for select to authenticated using (public.is_feedback_admin());
revoke insert, update, delete on public.feedback_drafts from authenticated;

create policy "admins read insights" on public.feedback_insights
  for select to authenticated using (public.is_feedback_admin());
create policy "admins insert insights" on public.feedback_insights
  for insert to authenticated with check (public.is_feedback_admin());
revoke update, delete on public.feedback_insights from authenticated;
