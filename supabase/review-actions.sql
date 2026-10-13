-- Adds the Send / Withdraw review workflow. Additive only.
-- Run once in Supabase Dashboard > SQL Editor.

begin;

alter table public.job_applications
  add column if not exists approved_at timestamptz;

-- Keep every existing status and add "Approved to Send" and "Withdrawn".
alter table public.job_applications drop constraint if exists valid_status;
alter table public.job_applications add constraint valid_status check (status in (
  'Discovered', 'Qualified', 'Drafted', 'Pending Review', 'Applied',
  'Interview Scheduled', 'Rejected', 'Offer Received', 'Hired',
  'Needs Information', 'Video Required', 'External Application',
  'Screened Out', 'Submission Failed', 'Employer Replied',
  'Approved to Send', 'Withdrawn'
));

commit;
