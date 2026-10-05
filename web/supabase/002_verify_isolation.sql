-- Run the entire file in Supabase SQL Editor as the project administrator.
-- All test users and journals are rolled back. Existing rows are not modified.
begin;
select set_config('snusless.test_a', gen_random_uuid()::text, true);
select set_config('snusless.test_b', gen_random_uuid()::text, true);
insert into auth.users (id) values
    (current_setting('snusless.test_a')::uuid),
    (current_setting('snusless.test_b')::uuid);
insert into public.journals (user_id,data,revision) values
    (current_setting('snusless.test_a')::uuid, '{"isolation_test":"A"}', 0),
    (current_setting('snusless.test_b')::uuid, '{"isolation_test":"B"}', 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('snusless.test_a'), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('snusless.test_a'),'role','authenticated')::text, true);
do $$
declare n integer;
begin
    select count(*) into n from public.journals where user_id=current_setting('snusless.test_a')::uuid;
    if n <> 1 then raise exception 'FAIL: A cannot read own journal'; end if;
    select count(*) into n from public.journals where user_id=current_setting('snusless.test_b')::uuid;
    if n <> 0 then raise exception 'FAIL: A can read B journal'; end if;
    update public.journals set revision=revision+1 where user_id=current_setting('snusless.test_b')::uuid;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: A can change B journal'; end if;
    delete from public.journals where user_id=current_setting('snusless.test_b')::uuid;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: A can delete B journal'; end if;
    begin
        insert into public.journals(user_id,data,revision) values(current_setting('snusless.test_b')::uuid,'{}',0);
        raise exception 'FAIL: A can insert as B';
    exception when insufficient_privilege then null;
    end;
    update public.journals set data='{"isolation_test":"A updated"}',revision=revision+1 where user_id=current_setting('snusless.test_a')::uuid and revision=0;
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'FAIL: A cannot update own journal'; end if;
    begin
        update public.journals set revision=revision where user_id=current_setting('snusless.test_a')::uuid;
        raise exception 'FAIL: invalid revision accepted';
    exception when check_violation then null;
    end;
end $$;

select set_config('request.jwt.claim.sub', current_setting('snusless.test_b'), true);
select set_config('request.jwt.claims', json_build_object('sub',current_setting('snusless.test_b'),'role','authenticated')::text, true);
do $$
declare n integer;
begin
    select count(*) into n from public.journals where user_id=current_setting('snusless.test_b')::uuid;
    if n <> 1 then raise exception 'FAIL: B cannot read own journal'; end if;
    select count(*) into n from public.journals where user_id=current_setting('snusless.test_a')::uuid;
    if n <> 0 then raise exception 'FAIL: B can read A journal'; end if;
    update public.journals set revision=revision+1 where user_id=current_setting('snusless.test_a')::uuid;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: B can change A journal'; end if;
    delete from public.journals where user_id=current_setting('snusless.test_a')::uuid;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: B can delete A journal'; end if;
    delete from public.journals where user_id=current_setting('snusless.test_b')::uuid;
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'FAIL: B cannot delete own journal'; end if;
    insert into public.journals(user_id,data,revision) values(current_setting('snusless.test_b')::uuid,'{}',0);
end $$;

set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$
begin
    begin
        perform 1 from public.journals where user_id=current_setting('snusless.test_a')::uuid;
        raise exception 'FAIL: anonymous table access granted';
    exception when insufficient_privilege then null;
    end;
end $$;
rollback;
select 'PASS: both accounts isolated; own writes work; invalid revisions and anonymous access blocked; test data rolled back.' as result;
