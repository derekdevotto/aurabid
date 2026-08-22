create extension if not exists pgcrypto;

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.aura_entries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  handle text not null,
  handle_key text not null,
  target_url text not null,
  title text not null default 'Aura recién desbloqueada',
  category text not null default 'Aura pura',
  bid_points integer not null check (bid_points > 0 and bid_points <= 100000000),
  clicks integer not null default 0 check (clicks >= 0),
  initials text not null default 'AU',
  tone text not null default 'violet',
  age_label text not null default 'ahora',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (season_id, handle_key)
);

create table if not exists public.aura_activities (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete cascade,
  handle text not null,
  activity_text text not null,
  bid_points integer check (bid_points is null or (bid_points > 0 and bid_points <= 100000000)),
  age_label text not null default 'ahora',
  created_at timestamptz not null default now()
);

create table if not exists public.aura_presence (
  session_id uuid primary key,
  season_id uuid not null references public.seasons(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

create table if not exists public.aura_stats (
  season_id uuid primary key references public.seasons(id) on delete cascade,
  visitor_count bigint not null default 0 check (visitor_count >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists aura_entries_season_bid_idx
  on public.aura_entries (season_id, bid_points desc, created_at asc);
create index if not exists aura_activities_season_created_idx
  on public.aura_activities (season_id, created_at desc);
create index if not exists aura_presence_season_seen_idx
  on public.aura_presence (season_id, last_seen_at desc);

create or replace function public.set_aura_entry_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists aura_entries_updated_at on public.aura_entries;
create trigger aura_entries_updated_at
before update on public.aura_entries
for each row execute function public.set_aura_entry_updated_at();

alter table public.seasons enable row level security;
alter table public.aura_entries enable row level security;
alter table public.aura_activities enable row level security;
alter table public.aura_presence enable row level security;
alter table public.aura_stats enable row level security;

grant select on public.seasons to anon, authenticated;
grant select on public.aura_entries to anon, authenticated;
grant select, insert on public.aura_activities to anon, authenticated;
grant select on public.aura_stats to anon, authenticated;

drop policy if exists "Aura seasons are public" on public.seasons;
create policy "Aura seasons are public" on public.seasons for select
to anon, authenticated using (true);

drop policy if exists "Aura entries are public" on public.aura_entries;
create policy "Aura entries are public" on public.aura_entries for select
to anon, authenticated using (true);

drop policy if exists "Aura activity is public" on public.aura_activities;
create policy "Aura activity is public" on public.aura_activities for select
to anon, authenticated using (true);

drop policy if exists "Aura activity can be recorded" on public.aura_activities;
create policy "Aura activity can be recorded" on public.aura_activities for insert
to anon, authenticated with check (
  length(trim(handle)) between 1 and 32
  and length(trim(activity_text)) between 1 and 280
  and (bid_points is null or bid_points between 1 and 100000000)
);

drop policy if exists "Presence is private" on public.aura_presence;
create policy "Presence is private" on public.aura_presence for select
to anon, authenticated using (false);

drop policy if exists "Aura stats are public" on public.aura_stats;
create policy "Aura stats are public" on public.aura_stats for select
to anon, authenticated using (true);

create or replace function public.register_aura_presence(
  p_season_id uuid,
  p_session_id uuid,
  p_new_visit boolean default false
)
returns table (online_count integer, visitor_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.seasons where id = p_season_id) then
    raise exception 'Unknown season';
  end if;

  insert into public.aura_presence (session_id, season_id, last_seen_at)
  values (p_session_id, p_season_id, now())
  on conflict (session_id) do update
  set season_id = excluded.season_id, last_seen_at = now();

  insert into public.aura_stats (season_id, visitor_count, updated_at)
  values (p_season_id, case when p_new_visit then 1 else 0 end, now())
  on conflict (season_id) do update
  set visitor_count = public.aura_stats.visitor_count + case when p_new_visit then 1 else 0 end,
      updated_at = now();

  delete from public.aura_presence where last_seen_at < now() - interval '90 seconds';

  return query
  select
    (select count(*)::integer from public.aura_presence p where p.season_id = p_season_id),
    (select s.visitor_count from public.aura_stats s where s.season_id = p_season_id);
end;
$$;

grant execute on function public.register_aura_presence(uuid, uuid, boolean) to anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'aura_entries') then
    alter publication supabase_realtime add table public.aura_entries;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'aura_activities') then
    alter publication supabase_realtime add table public.aura_activities;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'aura_stats') then
    alter publication supabase_realtime add table public.aura_stats;
  end if;
end
$$;

insert into public.seasons (slug, label, starts_at, ends_at, status)
values ('season-01', 'TEMPORADA 01 / HOY', now(), now() + interval '15 hours 34 minutes 22 seconds', 'active')
on conflict (slug) do update set status = 'active';

with season as (select id from public.seasons where slug = 'season-01')
insert into public.aura_entries
  (season_id, handle, handle_key, target_url, title, category, bid_points, clicks, initials, tone, age_label)
select season.id, seed.handle, lower(seed.handle), seed.target_url, seed.title, seed.category,
  seed.bid_points, seed.clicks, seed.initials, seed.tone, seed.age_label
from season
cross join (values
  ('lomitozen', 'https://x.com/lomitozen', 'Aura de boss final', 'Aura pura', 400, 9744, 'LZ', 'coral', '17 h'),
  ('sofi.exe', 'https://x.com/sofi.exe', 'No dijo nada y ganó', 'Vibe', 300, 6401, 'SE', 'violet', '12 h'),
  ('mateconhielo', 'https://x.com/mateconhielo', 'Energía de protagonista', 'Estilo', 200, 3288, 'MH', 'yellow', '9 h'),
  ('el_bicho', 'https://x.com/el_bicho', 'Aura inexplicable', 'Caos', 100, 1802, 'EB', 'blue', '5 h'),
  ('pancho2004', 'https://x.com/pancho2004', 'Tiene lore', 'Aura pura', 50, 744, 'P2', 'mint', '2 h')
) as seed(handle, target_url, title, category, bid_points, clicks, initials, tone, age_label)
on conflict (season_id, handle_key) do nothing;

with season as (select id from public.seasons where slug = 'season-01')
insert into public.aura_activities (season_id, handle, activity_text, bid_points, age_label)
select season.id, seed.handle, seed.activity_text, seed.bid_points, seed.age_label
from season
cross join (values
  ('sofi.exe', 'superó a mateconhielo', 300, 'hace 11 seg'),
  ('lomitozen', 'defendió el puesto #1', 400, 'hace 42 seg'),
  ('nacho.zip', 'entró a la categoría Caos', 100, 'hace 1 min')
) as seed(handle, activity_text, bid_points, age_label)
where not exists (
  select 1 from public.aura_activities a
  where a.season_id = season.id and a.handle = seed.handle and a.activity_text = seed.activity_text
);

insert into public.aura_stats (season_id, visitor_count)
select id, 186 from public.seasons where slug = 'season-01'
on conflict (season_id) do nothing;

create table if not exists public.aura_billing_events (
  id uuid primary key default gen_random_uuid(),
  paypal_order_id text not null unique,
  paypal_capture_id text,
  session_id uuid not null,
  points integer not null check (points > 0 and points <= 1000000),
  amount_usd numeric(10,2) not null check (amount_usd > 0),
  status text not null check (status in ('COMPLETED', 'PENDING', 'FAILED')),
  created_at timestamptz not null default now(),
  captured_at timestamptz
);

create table if not exists public.aura_wallets (
  session_id uuid primary key,
  balance_points integer not null default 0 check (balance_points >= 0),
  updated_at timestamptz not null default now()
);

alter table public.aura_billing_events enable row level security;
alter table public.aura_wallets enable row level security;
revoke all on public.aura_billing_events from public, anon, authenticated;
revoke all on public.aura_wallets from public, anon, authenticated;

drop policy if exists "Billing events are private" on public.aura_billing_events;
create policy "Billing events are private" on public.aura_billing_events for select
to anon, authenticated using (false);

drop policy if exists "Wallets are private" on public.aura_wallets;
create policy "Wallets are private" on public.aura_wallets for select
to anon, authenticated using (false);

create or replace function public.place_aura_bid(
  p_season_id uuid,
  p_handle text,
  p_target_url text,
  p_title text,
  p_category text,
  p_bid_points integer,
  p_initials text,
  p_tone text,
  p_clicks integer default 0,
  p_age_label text default 'ahora'
)
returns setof public.aura_entries
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_entry public.aura_entries;
begin
  if not exists (select 1 from public.seasons s where s.id = p_season_id and s.status = 'active') then
    raise exception 'SEASON_NOT_ACTIVE';
  end if;
  if p_handle is null or p_handle !~ '^[A-Za-z0-9_.-]{1,32}$'
    or p_target_url is null or length(p_target_url) < 4 or length(p_target_url) > 500
    or p_target_url !~* '^https?://'
    or p_category not in ('Aura pura', 'Vibe', 'Estilo', 'Caos')
    or p_bid_points is null or p_bid_points < 1 or p_bid_points > 100000000 then
    raise exception 'INVALID_BID';
  end if;

  insert into public.aura_entries
    (season_id, handle, handle_key, target_url, title, category, bid_points, clicks, initials, tone, age_label)
  values
    (p_season_id, p_handle, lower(trim(p_handle)), p_target_url,
     coalesce(nullif(trim(p_title), ''), 'Aura recién desbloqueada'),
     p_category, p_bid_points, greatest(coalesce(p_clicks, 0), 0),
     coalesce(nullif(trim(p_initials), ''), upper(left(p_handle, 2))),
     coalesce(nullif(trim(p_tone), ''), 'violet'),
     coalesce(nullif(trim(p_age_label), ''), 'ahora'))
  on conflict (season_id, handle_key) do update
  set target_url = excluded.target_url,
      title = excluded.title,
      category = excluded.category,
      bid_points = excluded.bid_points,
      initials = excluded.initials,
      tone = excluded.tone,
      age_label = excluded.age_label,
      updated_at = now()
  where public.aura_entries.bid_points < excluded.bid_points
  returning * into saved_entry;

  if not found then
    raise exception 'OUTBID_REQUIRED';
  end if;
  return next saved_entry;
end;
$$;

grant execute on function public.place_aura_bid(uuid, text, text, text, text, integer, text, text, integer, text) to anon;

create or replace function public.credit_paypal_capture(
  p_paypal_order_id text,
  p_paypal_capture_id text,
  p_session_id uuid,
  p_points integer,
  p_amount_usd numeric,
  p_status text
)
returns table (credited_points integer, balance_points integer, already_processed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_event_id uuid;
  current_balance integer;
begin
  if p_paypal_order_id is null or p_paypal_order_id = ''
    or p_session_id is null
    or p_points is null or p_points < 1 or p_points > 1000000
    or p_amount_usd is null or p_amount_usd <= 0
    or p_status <> 'COMPLETED' then
    raise exception 'INVALID_CAPTURE';
  end if;

  insert into public.aura_billing_events
    (paypal_order_id, paypal_capture_id, session_id, points, amount_usd, status, captured_at)
  values
    (p_paypal_order_id, p_paypal_capture_id, p_session_id, p_points, p_amount_usd, p_status, now())
  on conflict (paypal_order_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    select w.balance_points into current_balance from public.aura_wallets w where w.session_id = p_session_id;
    return query select 0, coalesce(current_balance, 0), true;
    return;
  end if;

  insert into public.aura_wallets (session_id, balance_points, updated_at)
  values (p_session_id, p_points, now())
  on conflict (session_id) do update
  set balance_points = public.aura_wallets.balance_points + excluded.balance_points,
      updated_at = now()
  returning aura_wallets.balance_points into current_balance;

  return query select p_points, current_balance, false;
end;
$$;

revoke all on function public.credit_paypal_capture(text, text, uuid, integer, numeric, text) from public, anon, authenticated;
grant execute on function public.credit_paypal_capture(text, text, uuid, integer, numeric, text) to service_role;
