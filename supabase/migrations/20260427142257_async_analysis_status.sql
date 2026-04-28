alter table public.matches
  add column if not exists status text,
  add column if not exists modal_job_id text,
  add column if not exists pipeline_stage text,
  add column if not exists submitted_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists error_message text,
  add column if not exists r2_key text;

alter table public.matches
  alter column status set default 'not_started';

alter table public.matches replica identity full;

create index if not exists matches_r2_key_idx on public.matches (r2_key);
