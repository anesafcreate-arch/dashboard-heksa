-- Fix RLS alat_masuk agar insert/update by owner berjalan konsisten.
-- Jalankan file ini di Supabase SQL Editor.

alter table if exists public.alat_masuk
  add column if not exists created_by uuid null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'alat_masuk'
      and column_name = 'created_by'
      and data_type <> 'uuid'
  ) then
    alter table public.alat_masuk
      alter column created_by drop default,
      alter column created_by type uuid using (
        case
          when created_by is null then null
          when trim(created_by::text) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
            then trim(created_by::text)::uuid
          else null
        end
      );
  end if;
end $$;

alter table if exists public.alat_masuk
  alter column created_by set default auth.uid();

alter table if exists public.alat_masuk
  drop constraint if exists alat_masuk_created_by_fkey;

alter table if exists public.alat_masuk
  add constraint alat_masuk_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table if exists public.alat_masuk enable row level security;

drop policy if exists "alat_masuk_select_own" on public.alat_masuk;
drop policy if exists "alat_masuk_insert_own" on public.alat_masuk;
drop policy if exists "alat_masuk_update_own" on public.alat_masuk;
drop policy if exists "alat_masuk_delete_own" on public.alat_masuk;
drop policy if exists "temporary_full_access" on public.alat_masuk;
drop policy if exists "dev_full_access_alat_masuk" on public.alat_masuk;

drop policy if exists "authenticated_insert_alat_masuk" on public.alat_masuk;
drop policy if exists "authenticated_select_alat_masuk" on public.alat_masuk;
drop policy if exists "authenticated_update_alat_masuk" on public.alat_masuk;
drop policy if exists "authenticated_delete_alat_masuk" on public.alat_masuk;

create policy "authenticated_insert_alat_masuk"
on public.alat_masuk
for insert
to authenticated
with check (auth.uid() = created_by);

create policy "authenticated_select_alat_masuk"
on public.alat_masuk
for select
to authenticated
using (auth.uid() = created_by or created_by is null);

create policy "authenticated_update_alat_masuk"
on public.alat_masuk
for update
to authenticated
using (auth.uid() = created_by or created_by is null)
with check (auth.uid() = created_by);

create policy "authenticated_delete_alat_masuk"
on public.alat_masuk
for delete
to authenticated
using (auth.uid() = created_by);

-- ONLY FOR DEVELOPMENT (sementara)
-- create policy "dev_full_access_alat_masuk"
-- on public.alat_masuk
-- for all
-- to authenticated
-- using (true)
-- with check (true);

-- Verifikasi struktur kolom created_by (harus uuid, boleh nullable).
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'alat_masuk'
  and column_name = 'created_by';
