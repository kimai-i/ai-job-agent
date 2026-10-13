-- Adds the tracking fields and status categories required by the job-hunting
-- agent (MASTER_PROMPT sections 18 and 26). Additive only: no columns, rows or
-- policies are removed. Run once in Supabase Dashboard > SQL Editor.

begin;

alter table public.job_applications
  add column if not exists posting_date date,
  add column if not exists expected_rate text,
  add column if not exists olj_points integer,
  add column if not exists application_method text,
  add column if not exists application_instructions text,
  add column if not exists email_subject text,
  add column if not exists rejection_reason text,
  add column if not exists video_required boolean,
  add column if not exists references_required boolean;

-- Keep all existing statuses and add the agent's categories.
alter table public.job_applications drop constraint if exists valid_status;
alter table public.job_applications add constraint valid_status check (status in (
  'Discovered', 'Qualified', 'Drafted', 'Pending Review', 'Applied',
  'Interview Scheduled', 'Rejected', 'Offer Received', 'Hired',
  'Needs Information', 'Video Required', 'External Application',
  'Screened Out', 'Submission Failed'
));

-- Prevent the same job being tracked twice for the same user.
create unique index if not exists job_applications_user_job_url_key
  on public.job_applications (user_id, normalized_job_url)
  where normalized_job_url is not null;

commit;
