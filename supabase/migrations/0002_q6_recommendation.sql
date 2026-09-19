-- Q6 is now: what would you tell someone thinking about joining the next challenge.
-- Additive on purpose: the previously deployed app still writes q6_dream_system,
-- so that column becomes optional instead of being dropped or renamed.
alter table public.feedback_responses add column q6_recommendation text;
alter table public.feedback_responses alter column q6_dream_system drop not null;

-- Once no old app version is running, these can be dropped:
--   alter table public.feedback_responses drop column q6_dream_system;
--   alter table public.feedback_responses drop column q6_job_title;
