-- Roth-Feller core schema.
-- Invariants (from the desk operating model):
--   * a ticket is approved once, by its owner, only while awaiting approval and unexpired;
--   * engines (service role) own every other status transition;
--   * the ticket audit log is append-only;
--   * broker secrets never live in these tables (only a Vault reference).

create type public.plan_tier as enum ('free', 'basic', 'advanced', 'pro', 'max', 'ultra');
create type public.desk_mode as enum ('paper', 'shadow', 'live');
create type public.asset_class as enum ('crypto', 'stocks', 'options', 'futures', 'forex', 'prediction', 'defi');
create type public.ticket_status as enum (
  'draft', 'risk_pass', 'risk_reject', 'awaiting_approval', 'approved',
  'sent', 'filled', 'reconciled', 'rejected', 'expired', 'cancelled'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  goal text check (goal in ('grow', 'income', 'learn')),
  experience text check (experience in ('new', 'some', 'active', 'pro')),
  markets public.asset_class[] not null default '{}',
  plan public.plan_tier not null default 'free',
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.desks (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My desk',
  mode public.desk_mode not null default 'paper',
  risk_limits jsonb not null default '{"risk_pct_per_trade": 0.5, "max_daily_loss_pct": 2, "max_open_tickets": 5}',
  created_at timestamptz not null default now()
);
create index desks_owner_idx on public.desks (owner);

create table public.broker_connections (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users (id) on delete cascade,
  desk_id uuid not null references public.desks (id) on delete cascade,
  venue text not null,
  asset_classes public.asset_class[] not null,
  auth_kind text not null check (auth_kind in ('oauth', 'api_key', 'wallet')),
  label text,
  status text not null default 'pending' check (status in ('pending', 'connected', 'error', 'revoked')),
  vault_secret_id uuid, -- reference into Supabase Vault, written by the server only
  created_at timestamptz not null default now()
);
create index broker_connections_owner_idx on public.broker_connections (owner);
create index broker_connections_desk_idx on public.broker_connections (desk_id);

create table public.tickets (
  id text primary key, -- RF-YYYYMMDD-NN-<suffix>
  owner uuid not null references auth.users (id) on delete cascade,
  desk_id uuid not null references public.desks (id) on delete cascade,
  mode public.desk_mode not null,
  venue text not null,
  market text not null,
  asset_class public.asset_class not null,
  side text not null check (side in ('buy', 'sell')),
  size numeric not null check (size > 0),
  entry numeric not null check (entry > 0),
  stop numeric not null check (stop > 0),
  risk_usd numeric not null check (risk_usd >= 0),
  stressed_distance numeric not null check (stressed_distance > 0),
  evidence jsonb not null default '[]',
  status public.ticket_status not null default 'draft',
  expires_at timestamptz not null default now() + interval '15 minutes',
  approved_at timestamptz,
  sent_at timestamptz,
  exchange_order_ids jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index tickets_owner_idx on public.tickets (owner, created_at desc);
create index tickets_desk_idx on public.tickets (desk_id);

create table public.ticket_events (
  id bigint generated always as identity primary key,
  ticket_id text not null references public.tickets (id) on delete cascade,
  owner uuid not null references auth.users (id) on delete cascade,
  from_status public.ticket_status,
  to_status public.ticket_status not null,
  actor text not null, -- desk role or 'owner'
  note text,
  created_at timestamptz not null default now()
);
create index ticket_events_ticket_idx on public.ticket_events (ticket_id);
create index ticket_events_owner_idx on public.ticket_events (owner);

create table public.subscriptions (
  owner uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan public.plan_tier not null default 'free',
  billing_interval text check (billing_interval in ('month', 'year')),
  status text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Row-level security: every row belongs to its owner.
alter table public.profiles enable row level security;
alter table public.desks enable row level security;
alter table public.broker_connections enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_events enable row level security;
alter table public.subscriptions enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "own profile update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "own desks read" on public.desks for select to authenticated using ((select auth.uid()) = owner);
create policy "own desks insert" on public.desks for insert to authenticated with check ((select auth.uid()) = owner and mode = 'paper');
create policy "own desks rename" on public.desks for update to authenticated
  using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);

create policy "own brokers read" on public.broker_connections for select to authenticated using ((select auth.uid()) = owner);
create policy "own brokers delete" on public.broker_connections for delete to authenticated using ((select auth.uid()) = owner);

create policy "own tickets read" on public.tickets for select to authenticated using ((select auth.uid()) = owner);
create policy "own ticket events read" on public.ticket_events for select to authenticated using ((select auth.uid()) = owner);
create policy "own subscription read" on public.subscriptions for select to authenticated using ((select auth.uid()) = owner);

-- Users may not change plan or mode columns directly; only the server (service role) may.
-- (A column-level revoke does nothing while a table-level grant exists, so grant columns explicitly.)
revoke update on public.profiles from authenticated, anon;
grant update (display_name, goal, experience, markets, onboarded_at) on public.profiles to authenticated;
revoke update on public.desks from authenticated, anon;
grant update (name) on public.desks to authenticated;

-- Exact, single, unexpired approval. The only ticket write an owner can make.
create or replace function public.approve_ticket(p_ticket_id text)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.tickets;
begin
  select * into t from public.tickets where id = p_ticket_id for update;
  if not found or t.owner <> (select auth.uid()) then
    raise exception 'ticket % not found', p_ticket_id using errcode = 'P0002';
  end if;
  if t.status <> 'awaiting_approval' then
    raise exception 'ticket % is %, not awaiting approval', p_ticket_id, t.status using errcode = 'P0001';
  end if;
  if t.expires_at <= now() then
    update public.tickets set status = 'expired' where id = p_ticket_id;
    insert into public.ticket_events (ticket_id, owner, from_status, to_status, actor, note)
      values (p_ticket_id, t.owner, t.status, 'expired', 'system', 'approval arrived after expiry');
    raise exception 'ticket % expired at %', p_ticket_id, t.expires_at using errcode = 'P0001';
  end if;
  update public.tickets set status = 'approved', approved_at = now() where id = p_ticket_id returning * into t;
  insert into public.ticket_events (ticket_id, owner, from_status, to_status, actor)
    values (p_ticket_id, t.owner, 'awaiting_approval', 'approved', 'owner');
  return t;
end;
$$;
revoke all on function public.approve_ticket(text) from public, anon;
grant execute on function public.approve_ticket(text) to authenticated;

-- New user: profile and a paper desk.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  insert into public.desks (owner) values (new.id);
  insert into public.subscriptions (owner) values (new.id);
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
