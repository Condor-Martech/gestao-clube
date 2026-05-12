-- Pipelines: visual sort pipelines (n8n-style) for product ordering.
-- Stores the canvas (nodes + edges) per user; the apply step writes
-- produto.order via apply_pipeline_order(eans).

create extension if not exists "moddatetime";

create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pipelines_owner_id_idx on public.pipelines(owner_id);
create index if not exists pipelines_updated_at_idx on public.pipelines(updated_at desc);

drop trigger if exists pipelines_set_updated_at on public.pipelines;
create trigger pipelines_set_updated_at
  before update on public.pipelines
  for each row execute procedure moddatetime(updated_at);

alter table public.pipelines enable row level security;

drop policy if exists "pipelines_read_all_authenticated" on public.pipelines;
create policy "pipelines_read_all_authenticated" on public.pipelines
  for select using (auth.role() = 'authenticated');

drop policy if exists "pipelines_insert_owner_only" on public.pipelines;
create policy "pipelines_insert_owner_only" on public.pipelines
  for insert with check (owner_id = auth.uid());

drop policy if exists "pipelines_update_owner_only" on public.pipelines;
create policy "pipelines_update_owner_only" on public.pipelines
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "pipelines_delete_owner_only" on public.pipelines;
create policy "pipelines_delete_owner_only" on public.pipelines
  for delete using (owner_id = auth.uid());

-- Atomic order rewrite for a filtered subset of produtos.
-- Receives an ordered array of EANs and writes order = 1..N.
-- Other rows in produto are left untouched.
create or replace function public.apply_pipeline_order(eans text[])
returns integer
language plpgsql
security invoker
as $$
declare
  affected integer;
begin
  if eans is null or array_length(eans, 1) is null then
    return 0;
  end if;

  with ordered as (
    select arr.ean, arr.idx
    from unnest(eans) with ordinality as arr(ean, idx)
  )
  update public.produto p
  set "order" = ordered.idx
  from ordered
  where p.ean = ordered.ean;

  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant execute on function public.apply_pipeline_order(text[]) to authenticated;
