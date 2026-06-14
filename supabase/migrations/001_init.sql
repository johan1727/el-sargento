-- ─────────────────────────────────────────────────────────────
-- El Sargento — esquema inicial
-- Prefijo sg_ para coexistir con otras apps en el mismo proyecto Supabase.
-- Tablas: sg_profiles, sg_goals, sg_checkins, sg_messages
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── sg_profiles ───────────────────────────────────────────────
create table if not exists sg_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  chosen_sergeant text default 'gomez',
  rank text default 'recluta',
  current_streak int default 0,
  longest_streak int default 0,
  is_premium boolean default false,
  trial_ends_at timestamptz default (now() + interval '7 days'),
  checkin_hour int default 8,
  last_checkin_date date,
  missed_days int default 0,
  onboarding_done boolean default false,
  created_at timestamptz default now()
);

-- ── sg_goals ──────────────────────────────────────────────────
create table if not exists sg_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references sg_profiles(id) on delete cascade,
  title text not null,
  type text default 'habit',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ── sg_checkins ───────────────────────────────────────────────
create table if not exists sg_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references sg_profiles(id) on delete cascade,
  goal_id uuid references sg_goals(id) on delete cascade,
  date date not null,
  completed boolean default false,
  created_at timestamptz default now(),
  unique (goal_id, date)
);

-- ── sg_messages ───────────────────────────────────────────────
create table if not exists sg_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references sg_profiles(id) on delete cascade,
  role text not null,
  content text not null,
  sergeant_id text,
  has_audio boolean default false,
  created_at timestamptz default now()
);

create index if not exists sg_goals_user_idx on sg_goals(user_id);
create index if not exists sg_checkins_user_date_idx on sg_checkins(user_id, date);
create index if not exists sg_messages_user_created_idx on sg_messages(user_id, created_at);

-- ── RLS ───────────────────────────────────────────────────────
alter table sg_profiles enable row level security;
alter table sg_goals enable row level security;
alter table sg_checkins enable row level security;
alter table sg_messages enable row level security;

drop policy if exists "sg_own_profile" on sg_profiles;
drop policy if exists "sg_own_goals" on sg_goals;
drop policy if exists "sg_own_checkins" on sg_checkins;
drop policy if exists "sg_own_messages" on sg_messages;

create policy "sg_own_profile" on sg_profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "sg_own_goals" on sg_goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sg_own_checkins" on sg_checkins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "sg_own_messages" on sg_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Trigger: auto-crear sg_profile al registrarse ─────────────
-- Nombre distinto al trigger del proyecto MY EX para no colisionar.
create or replace function public.sg_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.sg_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists sg_on_auth_user_created on auth.users;
create trigger sg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.sg_handle_new_user();
