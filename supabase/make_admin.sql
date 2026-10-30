-- =============================================================================
-- Make an existing Supabase Auth user an administrator.
-- 1. Create the user first: Supabase Dashboard -> Authentication -> Users -> Add user
--    (tick "Auto Confirm User").
-- 2. Replace the email below with that user's email, then run this in the SQL Editor.
-- Run it once per administrator (shop owner + one authorized admin = twice).
-- To remove an administrator:  delete from public.admin_users where email = '...';
-- =============================================================================
insert into public.admin_users (user_id, email)
select id, email from auth.users where lower(email) = lower('hv88786@gmail.com')
on conflict (user_id) do nothing;

-- Check the result (should list your admin):
select * from public.admin_users;
