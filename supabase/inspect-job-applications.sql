-- READ-ONLY inspection of public.job_applications.
-- Run in Supabase Dashboard > SQL Editor. It changes nothing.
-- Paste the single JSON result back into Claude Code (it contains no secrets).

select json_build_object(
  'columns', (
    select json_agg(json_build_object(
      'name', c.column_name,
      'type', c.data_type,
      'udt', c.udt_name,
      'nullable', c.is_nullable,
      'default', c.column_default
    ) order by c.ordinal_position)
    from information_schema.columns c
    where c.table_schema = 'public' and c.table_name = 'job_applications'
  ),
  'check_constraints', (
    select json_agg(json_build_object('name', con.conname, 'definition', pg_get_constraintdef(con.oid)))
    from pg_constraint con
    where con.conrelid = 'public.job_applications'::regclass and con.contype = 'c'
  ),
  'enum_values', (
    select json_agg(json_build_object('enum', t.typname, 'values', (
      select json_agg(e.enumlabel order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid
    )))
    from pg_type t
    where t.typtype = 'e'
      and t.typname in (
        select c.udt_name from information_schema.columns c
        where c.table_schema = 'public' and c.table_name = 'job_applications'
      )
  ),
  'rls_enabled', (
    select relrowsecurity from pg_class where oid = 'public.job_applications'::regclass
  ),
  'policies', (
    select json_agg(json_build_object(
      'name', p.policyname,
      'command', p.cmd,
      'roles', p.roles,
      'using', p.qual,
      'with_check', p.with_check
    ))
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'job_applications'
  ),
  'grants', (
    select json_agg(json_build_object('role', g.grantee, 'privilege', g.privilege_type))
    from information_schema.role_table_grants g
    where g.table_schema = 'public' and g.table_name = 'job_applications'
      and g.grantee in ('anon', 'authenticated')
  )
) as job_applications_schema;
