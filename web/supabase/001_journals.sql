-- Run once in your Supabase project's SQL Editor. No service-role key is needed by the app.
begin;
create table if not exists public.journals (
    user_id uuid primary key references auth.users(id) on delete cascade,
    data jsonb not null check (jsonb_typeof(data) = 'object'),
    revision integer not null default 0 check (revision >= 0),
    constraint journal_size check (octet_length(data::text) <= 2000000)
);
alter table public.journals enable row level security;
revoke all on public.journals from anon;
grant select, insert, update, delete on public.journals to authenticated;

drop policy if exists journal_select_own on public.journals;
create policy journal_select_own on public.journals for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists journal_insert_own on public.journals;
create policy journal_insert_own on public.journals for insert to authenticated with check ((select auth.uid()) = user_id and revision = 0);
drop policy if exists journal_update_own on public.journals;
create policy journal_update_own on public.journals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists journal_delete_own on public.journals;
create policy journal_delete_own on public.journals for delete to authenticated using ((select auth.uid()) = user_id);

-- Enforce the same revision discipline for every client, including direct REST calls.
create or replace function public.check_journal_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
    if new.user_id <> old.user_id or new.revision <> old.revision + 1 then
        raise exception 'Journal update requires next revision' using errcode = '23514';
    end if;
    return new;
end;
$$;
drop trigger if exists journal_revision on public.journals;
create trigger journal_revision before update on public.journals for each row execute function public.check_journal_revision();
commit;
