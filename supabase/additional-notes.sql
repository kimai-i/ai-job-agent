-- Adds a free-text "Additional Notes" field to each job (edited in the app's
-- Edit form). Safe to run more than once; does not touch existing data.
alter table public.job_applications
  add column if not exists additional_notes text;
