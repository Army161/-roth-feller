-- Stripe -> Supabase plan sync without a service-role key.
-- The webhook (which verifies Stripe's signature) calls public.stripe_sync with a shared
-- token; only the token's SHA-256 is stored here, in a schema no API role can read.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.app_secrets (
  name text primary key,
  sha256 text not null
);

-- One row per Stripe customer, filled in whichever order events arrive.
create table private.billing_customers (
  customer_id text primary key,
  owner uuid references auth.users (id) on delete cascade,
  subscription_id text,
  lookup_key text,
  status text,
  current_period_end timestamptz,
  ended boolean not null default false,
  updated_at timestamptz not null default now()
);

create or replace function public.stripe_sync(
  p_token text,
  p_customer text,
  p_owner uuid default null,
  p_subscription text default null,
  p_lookup text default null,
  p_status text default null,
  p_period_end timestamptz default null,
  p_ended boolean default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r private.billing_customers;
  v_plan public.plan_tier;
  v_interval text;
begin
  if not exists (
    select 1 from private.app_secrets
    where name = 'stripe_sync' and sha256 = encode(extensions.digest(p_token, 'sha256'), 'hex')
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into private.billing_customers as b (customer_id, owner, subscription_id, lookup_key, status, current_period_end, ended)
  values (p_customer, p_owner, p_subscription, p_lookup, p_status, p_period_end, coalesce(p_ended, false))
  on conflict (customer_id) do update set
    owner = coalesce(excluded.owner, b.owner),
    subscription_id = coalesce(excluded.subscription_id, b.subscription_id),
    lookup_key = coalesce(excluded.lookup_key, b.lookup_key),
    status = coalesce(excluded.status, b.status),
    current_period_end = coalesce(excluded.current_period_end, b.current_period_end),
    ended = coalesce(p_ended, b.ended),
    updated_at = now()
  returning * into r;

  if r.owner is null then return; end if;

  if r.ended or r.lookup_key is null or r.lookup_key !~ '^rf_(basic|advanced|pro|max|ultra)_(month|year)$' then
    v_plan := 'free';
    v_interval := null;
  else
    v_plan := split_part(r.lookup_key, '_', 2)::public.plan_tier;
    v_interval := split_part(r.lookup_key, '_', 3);
  end if;

  insert into public.subscriptions as s (owner, stripe_customer_id, stripe_subscription_id, plan, billing_interval, status, current_period_end, updated_at)
  values (r.owner, r.customer_id, case when r.ended then null else r.subscription_id end, v_plan, v_interval, r.status, r.current_period_end, now())
  on conflict (owner) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    plan = excluded.plan,
    billing_interval = excluded.billing_interval,
    status = excluded.status,
    current_period_end = excluded.current_period_end,
    updated_at = now();

  update public.profiles set plan = v_plan where id = r.owner;
end;
$$;

revoke all on function public.stripe_sync from public, authenticated;
grant execute on function public.stripe_sync to anon;
