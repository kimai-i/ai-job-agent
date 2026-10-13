-- Adds reply tracking for employer responses. Additive only.
-- Run once in Supabase Dashboard > SQL Editor.

begin;

alter table public.job_applications
  add column if not exists last_reply_at timestamptz,
  add column if not exists last_reply_channel text,
  add column if not exists last_reply_summary text;

-- Keep every existing status and add "Employer Replied".
alter table public.job_applications drop constraint if exists valid_status;
alter table public.job_applications add constraint valid_status check (status in (
  'Discovered', 'Qualified', 'Drafted', 'Pending Review', 'Applied',
  'Interview Scheduled', 'Rejected', 'Offer Received', 'Hired',
  'Needs Information', 'Video Required', 'External Application',
  'Screened Out', 'Submission Failed', 'Employer Replied'
));

commit;
