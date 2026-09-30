-- BBQ Party Score schema (for Supabase production)
-- V1 currently runs on an in-memory store for single-instance demos.
-- Migrate these tables when wiring Supabase Database / Realtime / Storage.

create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'setup',
  admin_pin_hash text not null,
  admin_pin_salt text not null,
  active_group_game text not null default 'none',
  group_game_id uuid,
  score_locked boolean not null default false,
  settlement_started_at timestamptz,
  donation_ends_at timestamptz,
  last_group_game_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  pin_hash text,
  pin_salt text,
  pin_set boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists player_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  token text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists score_transactions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  source_type text not null,
  source_id text not null,
  points int not null,
  note text,
  created_at timestamptz not null default now(),
  unique (event_id, player_id, source_type, source_id)
);

create table if not exists bingo_cards (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  line_bonuses text[] not null default '{}',
  full_bonus boolean not null default false,
  unique (event_id, player_id)
);

create table if not exists bingo_cells (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references bingo_cards(id) on delete cascade,
  idx int not null,
  category text not null,
  text text not null,
  mystery boolean not null default false,
  revealed boolean not null default true,
  photo_path text,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (card_id, idx)
);

create table if not exists player_secret_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  text text not null,
  points int not null,
  target_player_id uuid references players(id),
  completed boolean not null default false,
  completed_at timestamptz
);

create table if not exists bounty_templates (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  text text not null,
  points int not null
);

create table if not exists player_bounties (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  bounty_id uuid not null references bounty_templates(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (player_id, bounty_id)
);

create table if not exists player_targets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  target_player_id uuid not null references players(id),
  text text not null,
  points int not null,
  completed boolean not null default false,
  completed_at timestamptz,
  unique (event_id, player_id)
);

create table if not exists group_games (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  kind text not null,
  status text not null,
  round int not null default 1,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists final_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  unique (event_id, player_id)
);

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  rankings jsonb not null,
  tie_breaks jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists prize_decisions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  rank int not null,
  choice text,
  amount int not null default 10,
  decided_at timestamptz,
  auto boolean not null default false,
  unique (event_id, player_id)
);

-- Enable Realtime as needed:
-- alter publication supabase_realtime add table events;
-- alter publication supabase_realtime add table group_games;
-- alter publication supabase_realtime add table prize_decisions;
-- alter publication supabase_realtime add table score_transactions;
