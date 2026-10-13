-- Changes the allowed Client Acquisition values to:
--   Honoring, Partnership, Referral, B2B  (or empty when not known yet)
-- Run once in Supabase Dashboard > SQL Editor. Changes only this column's rules;
-- the table, its other columns, RLS policy and data are untouched.

begin;

alter table public.job_applications drop constraint if exists valid_acquisition;
alter table public.job_applications alter column client_acquisition drop default;
alter table public.job_applications alter column client_acquisition drop not null;

-- Clear any old values (Pending / In Progress / ...) that are no longer allowed.
update public.job_applications
set client_acquisition = null
where client_acquisition not in ('Honoring', 'Partnership', 'Referral', 'B2B');

alter table public.job_applications add constraint valid_acquisition
  check (client_acquisition in ('Honoring', 'Partnership', 'Referral', 'B2B'));

commit;
