-- Coincidir: esquema de base de datos.
-- Pegar todo en Supabase → SQL Editor → New query → Run.

create table if not exists public.events (
  id          text primary key check (char_length(id) between 6 and 20),
  name        text not null check (char_length(name) between 1 and 80),
  dates       text[] not null check (cardinality(dates) between 1 and 62),
  start_min   int not null check (start_min between 0 and 1439),
  end_min     int not null check (end_min between 1 and 1440 and end_min > start_min),
  slot_min    int not null check (slot_min in (15, 30, 60)),
  tz          text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.responses (
  event_id    text not null references public.events(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  slots       bigint[] not null default '{}' check (cardinality(slots) <= 6000),
  updated_at  timestamptz not null default now(),
  primary key (event_id, name)
);

alter table public.events    enable row level security;
alter table public.responses enable row level security;

-- Cualquiera con el link puede ver el evento y responder (igual que When2meet).
drop policy if exists "events_select" on public.events;
drop policy if exists "events_insert" on public.events;
drop policy if exists "responses_select" on public.responses;
drop policy if exists "responses_insert" on public.responses;
drop policy if exists "responses_update" on public.responses;

create policy "events_select"    on public.events    for select using (true);
create policy "events_insert"    on public.events    for insert with check (true);
create policy "responses_select" on public.responses for select using (true);
create policy "responses_insert" on public.responses for insert with check (true);
create policy "responses_update" on public.responses for update using (true) with check (true);

grant select, insert on public.events to anon;
grant select, insert, update on public.responses to anon;
