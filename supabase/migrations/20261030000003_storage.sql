-- =============================================================================
-- Shree Ram Garments - image storage
-- One PUBLIC bucket "store-media" (product photos, hero/promo banners, logo).
-- Public = anyone can open an image URL, which the website needs.
-- Only administrators may upload, replace or delete files.
-- Limits are enforced by Supabase itself, not only in the browser:
--   max 5 MB per file, only JPEG / PNG / WebP.
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-media', 'store-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "admins read store media"   on storage.objects;
drop policy if exists "admins upload store media" on storage.objects;
drop policy if exists "admins update store media" on storage.objects;
drop policy if exists "admins delete store media" on storage.objects;

create policy "admins read store media" on storage.objects
  for select to authenticated using (bucket_id = 'store-media' and public.is_admin());
create policy "admins upload store media" on storage.objects
  for insert to authenticated with check (bucket_id = 'store-media' and public.is_admin());
create policy "admins update store media" on storage.objects
  for update to authenticated
  using (bucket_id = 'store-media' and public.is_admin())
  with check (bucket_id = 'store-media' and public.is_admin());
create policy "admins delete store media" on storage.objects
  for delete to authenticated using (bucket_id = 'store-media' and public.is_admin());
