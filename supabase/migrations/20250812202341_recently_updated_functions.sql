-- Create helper functions to efficiently fetch recently updated novels
-- Orders novels by the timestamp of their latest chapter

create or replace function public.get_recently_updated_novel_ids(
  p_limit integer,
  p_offset integer
)
returns table(novel_id text)
language sql
stable
as $$
  with latest_per_novel as (
    select c.novel_id, max(c.created_at) as latest
    from public.chapters c
    group by c.novel_id
  )
  select n.id as novel_id
  from public.novels n
  join latest_per_novel l on l.novel_id = n.id
  where n.status <> 'DRAFT'
  order by l.latest desc nulls last
  limit p_limit offset p_offset;
$$;

create or replace function public.get_recently_updated_total()
returns integer
language sql
stable
as $$
  select count(*)::integer
  from (
    select n.id
    from public.novels n
    join public.chapters c on c.novel_id = n.id
    where n.status <> 'DRAFT'
    group by n.id
  ) t;
$$;

-- Helpful indexes for performance
create index if not exists idx_chapters_novel_id_created_at
  on public.chapters (novel_id, created_at desc);

create index if not exists idx_novels_status_id
  on public.novels (status, id);


