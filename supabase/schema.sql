-- BBQ Party Score production schema for Supabase Database / Realtime / Storage.

create extension if not exists "pgcrypto";

-- Durable aggregate used by the current game engine. This removes process
-- memory / Vercel instance affinity as a correctness requirement.
create table if not exists app_state (
  key text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  version bigint not null default 0
);


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


-- Who Wrote It
create table if not exists who_wrote_answers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  group_game_id uuid not null references group_games(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  round int not null,
  text text not null,
  revealed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (group_game_id, player_id, round)
);

create table if not exists who_wrote_votes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  group_game_id uuid not null references group_games(id) on delete cascade,
  round int not null,
  voter_player_id uuid not null references players(id) on delete cascade,
  guessed_player_id uuid not null references players(id) on delete cascade,
  correct boolean,
  created_at timestamptz not null default now(),
  unique (group_game_id, round, voter_player_id)
);

-- Final button battle. Clients should submit small batches rather than one request per tap.
create table if not exists final_button_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists final_button_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references final_button_sessions(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  batch_seq int not null,
  click_count int not null check (click_count >= 0),
  client_window_ms int not null check (client_window_ms > 0),
  received_at timestamptz not null default now(),
  unique (session_id, player_id, batch_seq)
);

create index if not exists idx_score_transactions_event_player on score_transactions(event_id, player_id);
create index if not exists idx_bingo_cells_card on bingo_cells(card_id);
create index if not exists idx_final_button_events_session_player on final_button_events(session_id, player_id);

-- Private bucket. The server uses the service-role key and returns short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('bingo-photos', 'bingo-photos', false)
on conflict (id) do update set public = excluded.public;

-- Realtime tables used by live party screens. Safe to re-run.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'events'
  ) then alter publication supabase_realtime add table events; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'group_games'
  ) then alter publication supabase_realtime add table group_games; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prize_decisions'
  ) then alter publication supabase_realtime add table prize_decisions; end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'score_transactions'
  ) then alter publication supabase_realtime add table score_transactions; end if;
end $$;


-- Optimistic compare-and-swap for concurrent party requests.
create or replace function save_app_state(p_expected_version bigint, p_next_state jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  current_version bigint;
begin
  select version into current_version from app_state where key = 'bbq-party-state-v2' for update;

  if not found then
    if p_expected_version <> 0 then
      raise exception 'STATE_CONFLICT';
    end if;
    insert into app_state(key, state, version, updated_at)
    values ('bbq-party-state-v2', p_next_state, 1, now());
    return 1;
  end if;

  if current_version <> p_expected_version then
    raise exception 'STATE_CONFLICT';
  end if;

  update app_state
  set state = p_next_state, version = current_version + 1, updated_at = now()
  where key = 'bbq-party-state-v2';
  return current_version + 1;
end;
$$;


-- High-concurrency counter used by the final button battle.
-- Kept separate from app_state so simultaneous taps never contend on the app-state CAS version.
create table if not exists final_button_click_counts (
  session_key text not null,
  player_key text not null,
  click_count int not null default 0 check (click_count >= 0),
  last_at_ms bigint not null default 0,
  primary key (session_key, player_key)
);

create or replace function record_final_button_clicks(
  p_session_key text,
  p_player_key text,
  p_click_count int,
  p_now_ms bigint
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  previous_ms bigint;
  accepted int;
  max_for_window int;
begin
  insert into final_button_click_counts(session_key, player_key, click_count, last_at_ms)
  values (p_session_key, p_player_key, 0, 0)
  on conflict (session_key, player_key) do nothing;

  select click_count, last_at_ms into current_count, previous_ms
  from final_button_click_counts
  where session_key = p_session_key and player_key = p_player_key
  for update;

  if previous_ms > 0 and p_now_ms - previous_ms < 40 then
    return current_count;
  end if;

  accepted := greatest(1, least(12, p_click_count));
  max_for_window := greatest(1, ceil(greatest(1, case when previous_ms > 0 then p_now_ms - previous_ms else 500 end)::numeric / 40)::int);
  accepted := least(accepted, max_for_window);

  update final_button_click_counts
  set click_count = click_count + accepted, last_at_ms = p_now_ms
  where session_key = p_session_key and player_key = p_player_key
  returning click_count into current_count;

  return current_count;
end;
$$;

revoke all on function record_final_button_clicks(text, text, int, bigint) from public, anon, authenticated;
grant execute on function record_final_button_clicks(text, text, int, bigint) to service_role;
