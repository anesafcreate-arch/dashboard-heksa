-- Supabase Auth + Roles setup for dashboard-heksa
-- Jalankan di Supabase SQL Editor.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum (
      'SuperAdmin',
      'Direktur',
      'Manager',
      'Supervisor',
      'Admin',
      'Teknisi'
    );
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'Teknisi',
  username text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create unique index if not exists idx_profiles_username_unique
  on public.profiles (lower(trim(username)))
  where username is not null and trim(username) <> '';

create or replace function public.resolve_role_from_email_and_metadata(
  p_email text,
  p_role text
)
returns public.user_role
language plpgsql
stable
as $$
declare
  v_username text := lower(split_part(coalesce(p_email, ''), '@', 1));
  v_role text := lower(trim(coalesce(p_role, '')));
begin
  -- Mapping role lama (string)
  if v_role in ('superadmin') then return 'SuperAdmin'; end if;
  if v_role in ('direktur') then return 'Direktur'; end if;
  if v_role in ('manager', 'managerkeuangan', 'managerpemasaran', 'managermutu') then return 'Manager'; end if;
  if v_role in ('supervisor') then return 'Supervisor'; end if;
  if v_role in ('admin') then return 'Admin'; end if;
  if v_role in ('teknisi') then return 'Teknisi'; end if;

  -- Mapping user lama -> role baru
  if v_username in ('dian', 'fida') then return 'Direktur'; end if;
  if v_username = 'uko' then return 'Manager'; end if;
  if v_username = 'dena' then return 'Supervisor'; end if;
  if v_username = 'amel' then return 'Admin'; end if;
  if v_username = 'hilal' then return 'Teknisi'; end if;

  return 'Teknisi';
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    coalesce(new.email, ''),
    public.resolve_role_from_email_and_metadata(
      new.email,
      coalesce(new.raw_user_meta_data ->> 'role', '')
    )
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

-- Backfill untuk user auth yang sudah ada sebelum trigger dibuat.
insert into public.profiles (id, email, role)
select
  u.id,
  coalesce(u.email, ''),
  public.resolve_role_from_email_and_metadata(
    u.email,
    coalesce(u.raw_user_meta_data ->> 'role', '')
  )
from auth.users u
on conflict (id) do update
set
  email = excluded.email,
  role = excluded.role;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(trim(role::text))
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

grant execute on function public.current_profile_role() to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_superadmin" on public.profiles;
create policy "profiles_insert_superadmin"
on public.profiles
for insert
to authenticated
with check (
  public.current_profile_role() = 'superadmin'
);

drop policy if exists "profiles_update_superadmin" on public.profiles;
create policy "profiles_update_superadmin"
on public.profiles
for update
to authenticated
using (
  public.current_profile_role() = 'superadmin'
)
with check (
  public.current_profile_role() = 'superadmin'
);
