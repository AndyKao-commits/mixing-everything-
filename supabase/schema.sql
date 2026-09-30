-- Party Room schema for Supabase
-- Run this in the Supabase SQL editor when switching from memory store to Supabase.

create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid,
  status text not null default 'lobby',
  selected_game_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  nickname text not null,
  avatar text not null default '🐷',
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  game_id text not null,
  mode text not null default 'classic',
  status text not null default 'mode_select',
  round int not null default 0,
  current_question_id text,
  categories text[] not null default '{}',
  used_question_ids text[] not null default '{}',
  answering_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  question_id text not null,
  player_id uuid not null references players(id) on delete cascade,
  score int not null,
  submitted_at timestamptz not null default now(),
  missed boolean not null default false,
  unique (session_id, question_id, player_id)
);

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table game_sessions;
alter publication supabase_realtime add table answers;
