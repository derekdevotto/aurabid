create table if not exists public.aura_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  delta_points integer not null check (delta_points <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null check (length(trim(reason)) between 1 and 120),
  paypal_order_id text,
  created_at timestamptz not null default now()
);

create index if not exists aura_wallet_transactions_session_idx
  on public.aura_wallet_transactions (session_id, created_at desc);

alter table public.aura_wallet_transactions enable row level security;
revoke all on public.aura_wallet_transactions from public, anon, authenticated;

drop function if exists public.place_aura_bid(uuid, text, text, text, text, integer, text, text, integer, text);

create or replace function public.place_aura_bid(
  p_session_id uuid,
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
  current_entry public.aura_entries;
  current_balance integer;
  bid_cost integer;
begin
  if p_session_id is null then
    raise exception 'INVALID_SESSION';
  end if;
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

  insert into public.aura_wallets (session_id, balance_points, updated_at)
  values (p_session_id, 0, now())
  on conflict (session_id) do nothing;

  select w.balance_points
    into current_balance
    from public.aura_wallets w
   where w.session_id = p_session_id
   for update;

  select e.*
    into current_entry
    from public.aura_entries e
   where e.season_id = p_season_id
     and e.handle_key = lower(trim(p_handle))
   for update;

  if current_entry.id is not null and p_bid_points <= current_entry.bid_points then
    raise exception 'OUTBID_REQUIRED';
  end if;

  bid_cost := p_bid_points - coalesce(current_entry.bid_points, 0);
  if coalesce(current_balance, 0) < bid_cost then
    raise exception 'INSUFFICIENT_AURA';
  end if;

  update public.aura_wallets
     set balance_points = current_balance - bid_cost,
         updated_at = now()
   where session_id = p_session_id;

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

  insert into public.aura_wallet_transactions
    (session_id, delta_points, balance_after, reason)
  values
    (p_session_id, -bid_cost, current_balance - bid_cost, 'aura_bid');

  return next saved_entry;
end;
$$;

revoke all on function public.place_aura_bid(uuid, uuid, text, text, text, text, integer, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.place_aura_bid(uuid, uuid, text, text, text, text, integer, text, text, integer, text) to service_role;

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

  insert into public.aura_wallet_transactions
    (session_id, delta_points, balance_after, reason, paypal_order_id)
  values
    (p_session_id, p_points, current_balance, 'paypal_capture', p_paypal_order_id);

  return query select p_points, current_balance, false;
end;
$$;

revoke all on function public.credit_paypal_capture(text, text, uuid, integer, numeric, text) from public, anon, authenticated;
grant execute on function public.credit_paypal_capture(text, text, uuid, integer, numeric, text) to service_role;
