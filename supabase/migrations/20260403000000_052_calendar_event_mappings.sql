create table calendar_event_mappings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade not null,
  item_type       text not null check (item_type in ('challenge', 'event', 'competition')),
  item_id         uuid not null,
  native_event_id text not null,
  platform        text not null check (platform in ('ios', 'android')),
  created_at      timestamptz default now(),
  unique(user_id, item_type, item_id, platform)
);

alter table calendar_event_mappings enable row level security;

create policy "Users manage own calendar mappings"
  on calendar_event_mappings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
