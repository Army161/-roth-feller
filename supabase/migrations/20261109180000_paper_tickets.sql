-- Paper tickets an owner can write, approve and see fill, end to end.
-- Owners still cannot write tickets directly; these definer functions are the only paths,
-- and both refuse anything but the owner's own paper desk.

create or replace function public.create_paper_ticket(
  p_market text,
  p_asset_class public.asset_class,
  p_side text,
  p_size numeric,
  p_entry numeric,
  p_stop numeric,
  p_risk_usd numeric,
  p_stressed_distance numeric,
  p_evidence jsonb default '[]'
) returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid := (select auth.uid());
  v_desk public.desks;
  v_day text := to_char(now() at time zone 'utc', 'YYYYMMDD');
  v_seq int;
  v_id text;
  t public.tickets;
begin
  if v_owner is null then raise exception 'sign in first' using errcode = '42501'; end if;
  select * into v_desk from public.desks where owner = v_owner order by created_at limit 1;
  if not found then raise exception 'no desk' using errcode = 'P0002'; end if;
  if v_desk.mode <> 'paper' then raise exception 'only paper desks can write tickets here' using errcode = 'P0001'; end if;
  if p_side not in ('buy', 'sell') or p_size <= 0 or p_entry <= 0 or p_stop <= 0 or p_stressed_distance <= 0 then
    raise exception 'ticket failed Risk Manager checks' using errcode = 'P0001';
  end if;
  if (p_side = 'buy' and p_stop >= p_entry) or (p_side = 'sell' and p_stop <= p_entry) then
    raise exception 'the stop must sit on the losing side of the entry' using errcode = 'P0001';
  end if;
  if length(trim(p_market)) = 0 or length(p_market) > 80 then
    raise exception 'name the market in 1 to 80 characters' using errcode = 'P0001';
  end if;

  select count(*) + 1 into v_seq from public.tickets where owner = v_owner and id like 'RF-' || v_day || '-%';
  v_id := 'RF-' || v_day || '-' || lpad(v_seq::text, 2, '0') || '-' || substr(md5(gen_random_uuid()::text), 1, 4);

  insert into public.tickets (id, owner, desk_id, mode, venue, market, asset_class, side, size, entry, stop,
                              risk_usd, stressed_distance, evidence, status)
  values (v_id, v_owner, v_desk.id, 'paper', 'Paper', trim(p_market), p_asset_class, p_side, p_size, p_entry, p_stop,
          p_risk_usd, p_stressed_distance, coalesce(p_evidence, '[]'), 'awaiting_approval')
  returning * into t;

  insert into public.ticket_events (ticket_id, owner, from_status, to_status, actor, note)
  values (v_id, v_owner, null, 'risk_pass', 'Risk Manager', 'sized on the stressed stop'),
         (v_id, v_owner, 'risk_pass', 'awaiting_approval', 'Desk Lead', 'expires in 15 minutes');
  return t;
end;
$$;
revoke all on function public.create_paper_ticket(text, public.asset_class, text, numeric, numeric, numeric, numeric, numeric, jsonb) from public, anon;
grant execute on function public.create_paper_ticket(text, public.asset_class, text, numeric, numeric, numeric, numeric, numeric, jsonb) to authenticated;

-- After approval, the paper Execution Trader fills once at the entry and records it.
create or replace function public.fill_paper_ticket(p_ticket_id text)
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
  if t.mode <> 'paper' then raise exception 'only paper tickets fill here' using errcode = 'P0001'; end if;
  if t.status <> 'approved' then
    raise exception 'ticket % is %, not approved', p_ticket_id, t.status using errcode = 'P0001';
  end if;
  update public.tickets set status = 'filled', sent_at = now() where id = p_ticket_id returning * into t;
  insert into public.ticket_events (ticket_id, owner, from_status, to_status, actor, note)
  values (p_ticket_id, t.owner, 'approved', 'filled', 'Execution Trader',
          format('paper fill: %s %s @ %s, stop %s resting', t.side, t.size, t.entry, t.stop));
  return t;
end;
$$;
revoke all on function public.fill_paper_ticket(text) from public, anon;
grant execute on function public.fill_paper_ticket(text) to authenticated;
