-- Add array columns for recruiter job sections.
-- Run this against your existing database to update public.jobs.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS what_you_will_do text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requirements text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.jobs.what_you_will_do IS 'List of responsibilities shown as What You Will Do.';
COMMENT ON COLUMN public.jobs.requirements IS 'List of requirements for the job role.';
