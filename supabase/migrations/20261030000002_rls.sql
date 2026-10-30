-- =============================================================================
-- Shree Ram Garments - privileges and Row Level Security (RLS)
-- Principles
--   * Visitors (role "anon") can only READ, and only public columns of active data.
--   * Only people listed in public.admin_users can change anything.
--   * Nothing here ever needs the service-role key in website code.
-- =============================================================================

-- Start from zero: remove every default privilege Supabase may have granted.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;

-- Enable RLS everywhere (a table with RLS enabled and no matching policy denies everything).
alter table public.admin_users      enable row level security;
alter table public.categories       enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images   enable row level security;
alter table public.store_settings   enable row level security;
alter table public.admin_settings   enable row level security;
alter table public.homepage_content enable row level security;
alter table public.announcements    enable row level security;

-- Helper functions (is_admin is created in the schema migration).
grant execute on function public.is_admin()                  to anon, authenticated;
revoke execute on function public.admin_save_product(jsonb) from public;
grant execute on function public.admin_save_product(jsonb)   to authenticated;

-- ---------------------------------------------------------------------------
-- Column-level read access for visitors. Private columns (exact stock counts,
-- storage paths, internal settings, admin list) are simply not granted.
-- ---------------------------------------------------------------------------
grant select (id, slug, name, subcategories, sort_order, is_active)
  on public.categories to anon;
grant select (id, slug, name, sku, description, category_id, subcategory, price,
              original_price, is_featured, is_new_arrival, is_active, created_at)
  on public.products to anon;
grant select (id, product_id, size, color, color_hex, sort_order, in_stock)
  on public.product_variants to anon;
grant select (id, product_id, url, sort_order)
  on public.product_images to anon;
grant select (store_name, logo_url, whatsapp_number, address, opening_hours,
              instagram_url, facebook_url, youtube_url, maps_url)
  on public.store_settings to anon;
grant select on public.homepage_content to anon;
grant select (id, message, link_url, sort_order) on public.announcements to anon;

-- Signed-in users: full table privileges, but RLS below limits them to admins
-- (plus the same public rows a visitor sees).
grant select, insert, update, delete on
  public.categories, public.products, public.product_variants, public.product_images,
  public.store_settings, public.admin_settings, public.homepage_content, public.announcements
  to authenticated;
grant select on public.admin_users to authenticated;
grant select on public.admin_inventory, public.admin_products_list to authenticated;

-- ---------------------------------------------------------------------------
-- Policies: public (read-only)
-- ---------------------------------------------------------------------------
create policy "public reads active categories" on public.categories
  for select to anon, authenticated using (is_active);

create policy "public reads active products" on public.products
  for select to anon, authenticated using (
    is_active
    and exists (select 1 from public.categories c where c.id = category_id and c.is_active)
  );

create policy "public reads variants of visible products" on public.product_variants
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id)
  );

create policy "public reads images of visible products" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id)
  );

create policy "public reads store settings" on public.store_settings
  for select to anon, authenticated using (true);

create policy "public reads homepage content" on public.homepage_content
  for select to anon, authenticated using (true);

create policy "public reads live announcements" on public.announcements
  for select to anon, authenticated using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at   is null or ends_at   >  now())
  );

-- ---------------------------------------------------------------------------
-- Policies: administrators (full control). is_admin() checks admin_users.
-- ---------------------------------------------------------------------------
create policy "admins manage categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage products" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage variants" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage images" on public.product_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage store settings" on public.store_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage admin settings" on public.admin_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage homepage content" on public.homepage_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins manage announcements" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- admin_users: a signed-in user may only see their own row (this is how the
-- admin panel confirms "am I an administrator?"). No insert/update/delete policy
-- exists, so the website can never grant admin rights - only the SQL Editor can.
create policy "users see own admin row" on public.admin_users
  for select to authenticated using (user_id = auth.uid());
