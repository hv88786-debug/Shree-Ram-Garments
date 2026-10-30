-- =============================================================================
-- Shree Ram Garments - core schema
-- Run order: 1) this file  2) 20261030000002_rls.sql  3) 20261030000003_storage.sql
--            4) (optional) ../seed.sql   5) ../make_admin.sql (after creating your admin user)
-- Safe to read top to bottom; every table is documented below.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- admin_users: who is allowed to manage the store.
-- A person is an administrator ONLY if their auth user id is listed here.
-- Rows can only be added from the Supabase SQL Editor (see make_admin.sql);
-- there is deliberately no policy that lets the website insert rows.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- categories: Men's Wear, Women's Wear, ... "subcategories" are the "type"
-- options shown in the shop filter (Shirts, Kurtis, ...).
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name          text not null check (char_length(btrim(name)) between 1 and 80),
  subcategories text[] not null default '{}',
  sort_order    integer not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
--   slug            used in product.html?id=<slug> (old links keep working)
--   original_price  optional "was" price; must be >= price
--   is_featured     shown in "Popular Picks" on the homepage (badge: Bestseller)
--   is_new_arrival  shown in "New Arrivals" on the homepage (badge: New Arrival)
--   is_active       false = hidden from the public website
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  name           text not null check (char_length(btrim(name)) between 1 and 160),
  sku            text check (sku is null or char_length(sku) <= 60),
  description    text not null default '' check (char_length(description) <= 4000),
  category_id    uuid not null references public.categories (id) on delete restrict,
  subcategory    text not null default '' check (char_length(subcategory) <= 80),
  price          numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) check (original_price is null or original_price >= price),
  is_featured    boolean not null default false,
  is_new_arrival boolean not null default false,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists products_sku_key on public.products (lower(sku)) where sku is not null;
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_public_idx   on public.products (is_active, created_at desc);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- product_variants: ONE ROW PER SIZE + COLOUR with its own stock count.
-- A product with no rows here simply does not track stock.
-- size/colour use '' (empty) when a product has no sizes / no colours.
-- "in_stock" is the only stock information the public website may read;
-- the exact "stock" number is hidden from visitors (see 20261030000002_rls.sql).
-- ---------------------------------------------------------------------------
create table if not exists public.product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  size       text not null default '' check (char_length(size) <= 40),
  color      text not null default '' check (char_length(color) <= 40),
  color_hex  text check (color_hex is null or color_hex ~ '^#[0-9a-fA-F]{6}$'),
  stock      integer not null default 0 check (stock >= 0 and stock <= 100000),
  sort_order integer not null default 0,
  in_stock   boolean generated always as (stock > 0) stored,
  unique (product_id, size, color)
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- product_images: files live in Supabase Storage (bucket "store-media");
-- the public URL is stored here. First image (lowest sort_order) is the cover.
-- ---------------------------------------------------------------------------
create table if not exists public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  url          text not null check (url ~ '^https?://'),
  storage_path text,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- store_settings (single row, id = 1): PUBLIC information only.
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  id              integer primary key default 1 check (id = 1),
  store_name      text not null default 'Shree Ram Garments & Sarees' check (char_length(btrim(store_name)) between 1 and 120),
  logo_url        text check (logo_url is null or logo_url ~ '^https?://'),
  whatsapp_number text not null default '917976399389' check (whatsapp_number ~ '^[0-9]{10,15}$'),
  address         text not null default '' check (char_length(address) <= 500),
  opening_hours   text not null default '' check (char_length(opening_hours) <= 200),
  instagram_url   text check (instagram_url is null or instagram_url ~ '^https?://'),
  facebook_url    text check (facebook_url  is null or facebook_url  ~ '^https?://'),
  youtube_url     text check (youtube_url   is null or youtube_url   ~ '^https?://'),
  maps_url        text check (maps_url      is null or maps_url      ~ '^https?://'),
  updated_at      timestamptz not null default now()
);
create trigger store_settings_updated_at before update on public.store_settings
  for each row execute function public.set_updated_at();
insert into public.store_settings (id, address, opening_hours, maps_url) values (
  1,
  'Kamla Modi Market, Gali No. 5 / 6, Near Oriental Bank, Neem Ka Thana, Rajasthan - 332713',
  'Monday – Sunday: 10:00 AM – 9:00 PM',
  'https://maps.app.goo.gl/v6nTMjdvUmLzMtP86'
) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- admin_settings (single row): internal settings, NEVER readable by visitors.
-- ---------------------------------------------------------------------------
create table if not exists public.admin_settings (
  id                  integer primary key default 1 check (id = 1),
  low_stock_threshold integer not null default 5 check (low_stock_threshold between 0 and 1000)
);
insert into public.admin_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- homepage_content (single row): hero banner + promotional banner text.
-- Empty values make the website fall back to the text written in index.html.
-- ---------------------------------------------------------------------------
create table if not exists public.homepage_content (
  id                   integer primary key default 1 check (id = 1),
  hero_image_url       text check (hero_image_url is null or hero_image_url ~ '^https?://'),
  hero_badge           text not null default 'Family Clothing Store • Neem Ka Thana' check (char_length(hero_badge) <= 80),
  hero_title           text not null default 'Fashion for Every Generation,' check (char_length(hero_title) <= 120),
  hero_title_accent    text not null default 'Everyday Style' check (char_length(hero_title_accent) <= 80),
  hero_subtitle        text not null default '' check (char_length(hero_subtitle) <= 240),
  promo_is_active      boolean not null default true,
  promo_starts_at      timestamptz,
  promo_ends_at        timestamptz,
  promo_badge          text not null default 'Handloom Legacy • Neem Ka Thana' check (char_length(promo_badge) <= 80),
  promo_heading        text not null default 'Celebrate Every Occasion with' check (char_length(promo_heading) <= 120),
  promo_heading_accent text not null default 'Timeless Grace' check (char_length(promo_heading_accent) <= 80),
  promo_body           text not null default 'From grand wedding galas to cherished family rituals and everyday comfort, Shree Ram Garments brings the regal elegance of Rajasthani handcrafts straight to your household.' check (char_length(promo_body) <= 500),
  promo_image_url      text check (promo_image_url is null or promo_image_url ~ '^https?://'),
  updated_at           timestamptz not null default now(),
  check (promo_ends_at is null or promo_starts_at is null or promo_ends_at > promo_starts_at)
);
create trigger homepage_content_updated_at before update on public.homepage_content
  for each row execute function public.set_updated_at();
insert into public.homepage_content (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- announcements: the slim maroon strip at the very top of every page.
-- Optional start/end time lets the owner schedule festival offers.
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  message    text not null check (char_length(btrim(message)) between 1 and 160),
  link_url   text check (link_url is null or link_url ~ '^(https?://|/|[a-z0-9_-]+\.html)'),
  is_active  boolean not null default true,
  starts_at  timestamptz,
  ends_at    timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- ---------------------------------------------------------------------------
-- admin_save_product(payload jsonb): creates/updates a product together with
-- its size/colour stock rows and its images in ONE transaction.
-- Runs with the caller's rights ("security invoker") so Row Level Security
-- still applies, and additionally refuses anyone who is not an administrator.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.admin_save_product(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  pid     uuid := nullif(payload->>'id', '')::uuid;
  v_name  text := btrim(coalesce(payload->>'name', ''));
  v_sku   text := nullif(btrim(coalesce(payload->>'sku', '')), '');
  v_slug  text;
  v_orig  numeric := nullif(payload->>'original_price', '')::numeric;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if v_name = '' then
    raise exception 'Product name is required' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(payload->'variants', '[]'::jsonb)) > 300 then
    raise exception 'Too many size/colour combinations (max 300)' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(payload->'images', '[]'::jsonb)) > 10 then
    raise exception 'A product can have at most 10 images' using errcode = '22023';
  end if;

  if pid is null then
    v_slug := trim(both '-' from lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')));
    if v_slug = '' then v_slug := 'product'; end if;
    v_slug := left(v_slug, 60) || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
    insert into public.products
      (slug, name, sku, description, category_id, subcategory, price, original_price,
       is_featured, is_new_arrival, is_active)
    values
      (v_slug, v_name, v_sku, coalesce(payload->>'description', ''),
       (payload->>'category_id')::uuid, coalesce(payload->>'subcategory', ''),
       (payload->>'price')::numeric, v_orig,
       coalesce((payload->>'is_featured')::boolean, false),
       coalesce((payload->>'is_new_arrival')::boolean, false),
       coalesce((payload->>'is_active')::boolean, true))
    returning id into pid;
  else
    update public.products set
      name = v_name, sku = v_sku,
      description = coalesce(payload->>'description', ''),
      category_id = (payload->>'category_id')::uuid,
      subcategory = coalesce(payload->>'subcategory', ''),
      price = (payload->>'price')::numeric,
      original_price = v_orig,
      is_featured = coalesce((payload->>'is_featured')::boolean, false),
      is_new_arrival = coalesce((payload->>'is_new_arrival')::boolean, false),
      is_active = coalesce((payload->>'is_active')::boolean, true)
    where id = pid;
    if not found then
      raise exception 'Product not found' using errcode = 'P0002';
    end if;
  end if;

  -- Size/colour stock rows: remove the ones no longer listed, upsert the rest.
  if payload ? 'variants' then
    delete from public.product_variants pv
    where pv.product_id = pid
      and not exists (
        select 1 from jsonb_array_elements(payload->'variants') e(val)
        where btrim(coalesce(e.val->>'size', '')) = pv.size
          and btrim(coalesce(e.val->>'color', '')) = pv.color);

    insert into public.product_variants (product_id, size, color, color_hex, stock, sort_order)
    select distinct on (sz, col) pid, sz, col, hx, stk, (ord - 1)::int
    from (
      select btrim(coalesce(e.val->>'size', ''))  as sz,
             btrim(coalesce(e.val->>'color', '')) as col,
             nullif(e.val->>'color_hex', '')      as hx,
             greatest(coalesce((e.val->>'stock')::int, 0), 0) as stk,
             e.ord
      from jsonb_array_elements(payload->'variants') with ordinality as e(val, ord)
    ) src
    order by sz, col, ord
    on conflict (product_id, size, color) do update
      set color_hex = excluded.color_hex, stock = excluded.stock, sort_order = excluded.sort_order;
  end if;

  -- Images: replace the whole ordered list.
  if payload ? 'images' then
    delete from public.product_images where product_id = pid;
    insert into public.product_images (product_id, url, storage_path, sort_order)
    select pid, e.val->>'url', nullif(e.val->>'storage_path', ''), (e.ord - 1)::int
    from jsonb_array_elements(payload->'images') with ordinality as e(val, ord);
  end if;

  return pid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin-only read views (security_invoker => they obey Row Level Security).
-- ---------------------------------------------------------------------------
create or replace view public.admin_inventory with (security_invoker = true) as
select
  v.id            as variant_id,
  v.product_id,
  p.name          as product_name,
  p.sku,
  p.is_active     as product_active,
  p.category_id,
  c.name          as category_name,
  v.size,
  v.color,
  v.color_hex,
  v.stock,
  (v.stock = 0)   as is_out,
  (v.stock > 0 and v.stock <= (select coalesce(max(low_stock_threshold), 5) from public.admin_settings)) as is_low,
  (select i.url from public.product_images i where i.product_id = p.id order by i.sort_order limit 1) as image_url
from public.product_variants v
join public.products   p on p.id = v.product_id
join public.categories c on c.id = p.category_id;

create or replace view public.admin_products_list with (security_invoker = true) as
select
  p.id, p.slug, p.name, p.sku, p.description, p.category_id, p.subcategory, p.price,
  p.original_price, p.is_featured, p.is_new_arrival, p.is_active, p.created_at, p.updated_at,
  c.name as category_name,
  coalesce(s.variant_count, 0)::int as variant_count,
  coalesce(s.total_stock, 0)::int   as total_stock,
  coalesce(s.attention_count, 0)::int as attention_count,
  case
    when coalesce(s.variant_count, 0) = 0 then 'untracked'
    when s.total_stock = 0               then 'out'
    when s.attention_count > 0           then 'low'
    else 'ok'
  end as stock_status,
  (select i.url from public.product_images i where i.product_id = p.id order by i.sort_order limit 1) as image_url
from public.products p
join public.categories c on c.id = p.category_id
left join (
  select pv.product_id,
         count(*)        as variant_count,
         sum(pv.stock)   as total_stock,
         count(*) filter (where pv.stock <= t.th) as attention_count
  from public.product_variants pv
  cross join (select coalesce(max(low_stock_threshold), 5) as th from public.admin_settings) t
  group by pv.product_id
) s on s.product_id = p.id;
