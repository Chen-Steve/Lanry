create table drive_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.profiles(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table drive_accounts enable row level security;

create policy "Owner access" on drive_accounts
  for all using (auth.uid()::text = user_id);