-- UniMap Supabase schema
-- Paste this whole file into the Supabase SQL Editor.
-- Supabase Auth already owns auth.users; this file links app data to auth.users,
-- enables RLS, and creates the tables used by feedback and campus services.

create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('student', 'staff', 'admin');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.feedback_status as enum ('new', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.lost_found_status as enum ('new', 'processing', 'ready', 'returned', 'archived');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.slot_status as enum ('available', 'busy', 'maintenance');
exception when duplicate_object then null;
end;
$$;

do $$
begin
  create type public.meal_category as enum ('breakfast', 'lunch', 'dinner', 'snack', 'drink');
exception when duplicate_object then null;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role public.app_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'ru' check (locale in ('ru', 'kk', 'en')),
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  map_style text not null default 'auto' check (map_style in ('auto', 'light', 'dark', 'relief')),
  external_map_service text not null default 'yandex' check (external_map_service in ('yandex', '2gis', 'google')),
  global_map_provider text not null default 'osm' check (global_map_provider in ('osm', 'google', '2gis', 'yandex')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic text not null check (char_length(trim(topic)) > 0),
  message text not null check (char_length(trim(message)) > 0),
  locale text not null default 'ru' check (locale in ('ru', 'kk', 'en')),
  status public.feedback_status not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lost_found_items (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title jsonb not null,
  location_note jsonb not null default '{}'::jsonb,
  description jsonb not null default '{}'::jsonb,
  room_id text,
  photo_urls text[] not null default '{}',
  contact_email text,
  status public.lost_found_status not null default 'new',
  reported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_slots (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  title jsonb not null,
  time_label jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  features jsonb not null default '[]'::jsonb,
  status public.slot_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_slots_time_order check (starts_at is null or ends_at is null or starts_at < ends_at)
);

create table if not exists public.room_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  booking_slot_id uuid references public.booking_slots(id) on delete set null,
  room_id text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  purpose text,
  attendees integer not null default 1 check (attendees > 0),
  notes text,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint room_bookings_time_order check (starts_at < ends_at)
);

create table if not exists public.dining_menu_items (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null,
  badge jsonb not null default '{}'::jsonb,
  category public.meal_category not null default 'lunch',
  price numeric(10, 2) not null default 0 check (price >= 0),
  currency text not null default 'KZT',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade,
  group_name text,
  day date not null,
  lesson_number integer check (lesson_number is null or lesson_number > 0),
  starts_at time not null,
  ends_at time not null,
  subject jsonb not null,
  lesson_type text,
  teacher text,
  room_id text,
  room_label text,
  meeting_url text,
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schedule_items_time_order check (starts_at < ends_at)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role and not public.is_admin() then
    raise exception 'Only admins can change profile roles.';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists protect_profile_role_update on public.profiles;
create trigger protect_profile_role_update
before update on public.profiles
for each row execute function public.protect_profile_role();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_feedback_requests_updated_at on public.feedback_requests;
create trigger set_feedback_requests_updated_at
before update on public.feedback_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_lost_found_items_updated_at on public.lost_found_items;
create trigger set_lost_found_items_updated_at
before update on public.lost_found_items
for each row execute function public.set_updated_at();

drop trigger if exists set_booking_slots_updated_at on public.booking_slots;
create trigger set_booking_slots_updated_at
before update on public.booking_slots
for each row execute function public.set_updated_at();

drop trigger if exists set_room_bookings_updated_at on public.room_bookings;
create trigger set_room_bookings_updated_at
before update on public.room_bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_dining_menu_items_updated_at on public.dining_menu_items;
create trigger set_dining_menu_items_updated_at
before update on public.dining_menu_items
for each row execute function public.set_updated_at();

drop trigger if exists set_schedule_items_updated_at on public.schedule_items;
create trigger set_schedule_items_updated_at
before update on public.schedule_items
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.feedback_requests enable row level security;
alter table public.lost_found_items enable row level security;
alter table public.booking_slots enable row level security;
alter table public.room_bookings enable row level security;
alter table public.dining_menu_items enable row level security;
alter table public.schedule_items enable row level security;

drop policy if exists "profiles select own or admin" on public.profiles;
create policy "profiles select own or admin"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles update own or admin" on public.profiles;
create policy "profiles update own or admin"
on public.profiles for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles delete admin" on public.profiles;
create policy "profiles delete admin"
on public.profiles for delete to authenticated
using (public.is_admin());

drop policy if exists "user settings select own" on public.user_settings;
create policy "user settings select own"
on public.user_settings for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "user settings insert own" on public.user_settings;
create policy "user settings insert own"
on public.user_settings for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "user settings update own" on public.user_settings;
create policy "user settings update own"
on public.user_settings for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "feedback insert own" on public.feedback_requests;
create policy "feedback insert own"
on public.feedback_requests for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "feedback select own or admin" on public.feedback_requests;
create policy "feedback select own or admin"
on public.feedback_requests for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "feedback update admin" on public.feedback_requests;
create policy "feedback update admin"
on public.feedback_requests for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "feedback delete admin" on public.feedback_requests;
create policy "feedback delete admin"
on public.feedback_requests for delete to authenticated
using (public.is_admin());

drop policy if exists "lost found read authenticated" on public.lost_found_items;
create policy "lost found read authenticated"
on public.lost_found_items for select to authenticated
using (true);

drop policy if exists "lost found insert own" on public.lost_found_items;
create policy "lost found insert own"
on public.lost_found_items for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "lost found update own or admin" on public.lost_found_items;
create policy "lost found update own or admin"
on public.lost_found_items for update to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "lost found delete admin" on public.lost_found_items;
create policy "lost found delete admin"
on public.lost_found_items for delete to authenticated
using (public.is_admin());

drop policy if exists "booking slots read authenticated" on public.booking_slots;
create policy "booking slots read authenticated"
on public.booking_slots for select to authenticated
using (true);

drop policy if exists "booking slots admin manage" on public.booking_slots;
create policy "booking slots admin manage"
on public.booking_slots for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "room bookings select own or admin" on public.room_bookings;
create policy "room bookings select own or admin"
on public.room_bookings for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "room bookings insert own" on public.room_bookings;
create policy "room bookings insert own"
on public.room_bookings for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "room bookings update own or admin" on public.room_bookings;
create policy "room bookings update own or admin"
on public.room_bookings for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists "room bookings delete admin" on public.room_bookings;
create policy "room bookings delete admin"
on public.room_bookings for delete to authenticated
using (public.is_admin());

drop policy if exists "dining read active" on public.dining_menu_items;
create policy "dining read active"
on public.dining_menu_items for select to authenticated
using (is_active or public.is_admin());

drop policy if exists "dining admin manage" on public.dining_menu_items;
create policy "dining admin manage"
on public.dining_menu_items for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "schedule select own common or admin" on public.schedule_items;
create policy "schedule select own common or admin"
on public.schedule_items for select to authenticated
using (owner_user_id is null or owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "schedule insert own or admin" on public.schedule_items;
create policy "schedule insert own or admin"
on public.schedule_items for insert to authenticated
with check (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "schedule update own or admin" on public.schedule_items;
create policy "schedule update own or admin"
on public.schedule_items for update to authenticated
using (owner_user_id = auth.uid() or public.is_admin())
with check (owner_user_id = auth.uid() or public.is_admin());

drop policy if exists "schedule delete own or admin" on public.schedule_items;
create policy "schedule delete own or admin"
on public.schedule_items for delete to authenticated
using (owner_user_id = auth.uid() or public.is_admin());

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists feedback_requests_user_status_idx on public.feedback_requests(user_id, status, created_at desc);
create index if not exists lost_found_items_status_idx on public.lost_found_items(status, reported_at desc);
create index if not exists booking_slots_room_time_idx on public.booking_slots(room_id, starts_at);
create index if not exists room_bookings_user_time_idx on public.room_bookings(user_id, starts_at desc);
create index if not exists room_bookings_room_time_idx on public.room_bookings(room_id, starts_at, ends_at);
create index if not exists dining_menu_items_active_sort_idx on public.dining_menu_items(is_active, sort_order);
create index if not exists schedule_items_owner_day_idx on public.schedule_items(owner_user_id, day, starts_at);
create index if not exists schedule_items_group_day_idx on public.schedule_items(group_name, day, starts_at);

grant usage on schema public to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.set_updated_at() to authenticated;
grant execute on function public.handle_new_user() to authenticated;
grant select, insert, update, delete on
  public.profiles,
  public.user_settings,
  public.feedback_requests,
  public.lost_found_items,
  public.booking_slots,
  public.room_bookings,
  public.dining_menu_items,
  public.schedule_items
to authenticated;
