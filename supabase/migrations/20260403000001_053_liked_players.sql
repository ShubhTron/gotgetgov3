-- Migration: 053 — liked_players table
-- Persists heart/favorite actions from the Discover tab

create table if not exists liked_players (
  id             uuid        primary key default gen_random_uuid(),
  liker_id       uuid        not null references profiles(id) on delete cascade,
  liked_user_id  uuid        not null references profiles(id) on delete cascade,
  sport          text        not null,
  created_at     timestamptz not null default now(),
  unique (liker_id, liked_user_id, sport)
);

-- Index for fast lookup of "who did I like?"
create index if not exists liked_players_liker_id_idx on liked_players(liker_id);

-- RLS
alter table liked_players enable row level security;

create policy "Users can read own likes"
  on liked_players for select
  using (liker_id = auth.uid());

create policy "Users can insert own likes"
  on liked_players for insert
  with check (liker_id = auth.uid());

create policy "Users can delete own likes"
  on liked_players for delete
  using (liker_id = auth.uid());
