-- Global Atelier
-- Einmal im Supabase SQL Editor ausführen.
-- Das Skript kann erneut ausgeführt werden.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create table if not exists private.sku_counters (
  prefix text primary key,
  last_number integer not null
);

revoke all on table private.sku_counters from public;
revoke all on table private.sku_counters from anon;
revoke all on table private.sku_counters from authenticated;

alter table private.sku_counters enable row level security;

create or replace function private.sku_prefix(product_name text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  normalized text;
  words text[];
  first_word text;
  prefix text;
begin
  normalized := product_name;
  normalized := replace(normalized, 'ä', 'ae');
  normalized := replace(normalized, 'ö', 'oe');
  normalized := replace(normalized, 'ü', 'ue');
  normalized := replace(normalized, 'ß', 'ss');
  normalized := replace(normalized, 'Ä', 'AE');
  normalized := replace(normalized, 'Ö', 'OE');
  normalized := replace(normalized, 'Ü', 'UE');
  normalized := upper(normalized);
  normalized := replace(normalized, '-', ' ');
  normalized := regexp_replace(normalized, '[^A-Z ]', '', 'g');
  normalized := regexp_replace(btrim(normalized), '[[:space:]]+', ' ', 'g');

  if normalized is null or normalized = '' then
    return 'PRD';
  end if;

  words := string_to_array(normalized, ' ');
  first_word := words[1];

  if coalesce(array_length(words, 1), 0) >= 2 and words[2] <> '' then
    prefix := left(first_word, 2) || left(words[2], 1);
  else
    prefix := left(first_word, 3);
  end if;

  if prefix is null or prefix = '' then
    return 'PRD';
  end if;

  return prefix;
end;
$$;

create or replace function private.next_sku(product_name text)
returns text
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  sku_prefix text;
  next_num integer;
begin
  sku_prefix := private.sku_prefix(product_name);

  insert into private.sku_counters as counters (prefix, last_number)
  values (sku_prefix, 1)
  on conflict (prefix) do update
    set last_number = counters.last_number + 1
  returning last_number into next_num;

  return sku_prefix || next_num::text;
end;
$$;

create or replace function private.slugify(value text)
returns text
language plpgsql
immutable
set search_path = pg_catalog
as $$
declare
  normalized text;
begin
  normalized := value;
  normalized := replace(normalized, 'ä', 'ae');
  normalized := replace(normalized, 'ö', 'oe');
  normalized := replace(normalized, 'ü', 'ue');
  normalized := replace(normalized, 'ß', 'ss');
  normalized := replace(normalized, 'Ä', 'ae');
  normalized := replace(normalized, 'Ö', 'oe');
  normalized := replace(normalized, 'Ü', 'ue');
  normalized := lower(normalized);
  normalized := regexp_replace(normalized, '[^a-z0-9]+', '-', 'g');
  normalized := btrim(normalized, '-');

  if normalized is null or normalized = '' then
    return 'produkt';
  end if;

  return normalized;
end;
$$;

create or replace function private.prepare_product()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 2;
begin
  new.name := btrim(new.name);
  new.brand := nullif(btrim(coalesce(new.brand, '')), '');
  new.category := nullif(btrim(coalesce(new.category, '')), '');

  if tg_op = 'INSERT' then
    if new.sku is null or btrim(new.sku) = '' then
      new.sku := private.next_sku(new.name);
    end if;

    if new.slug is null or btrim(new.slug) = '' then
      base_slug := private.slugify(new.name);
      candidate := base_slug;

      while exists (
        select 1
        from public.products as product
        where product.slug = candidate
      ) loop
        candidate := base_slug || '-' || suffix::text;
        suffix := suffix + 1;
      end loop;

      new.slug := candidate;
    end if;
  else
    new.sku := old.sku;
    new.slug := old.slug;
    new.id := old.id;
    new.created_at := old.created_at;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.touch_settings()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.id := 1;
  new.shop_name := btrim(new.shop_name);
  new.whatsapp_number := btrim(coalesce(new.whatsapp_number, ''));
  new.instagram_url := btrim(coalesce(new.instagram_url, ''));
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.sku_prefix(text) from public, anon, authenticated;
revoke all on function private.next_sku(text) from public, anon, authenticated;
revoke all on function private.slugify(text) from public, anon, authenticated;
revoke all on function private.prepare_product() from public, anon;
revoke all on function private.touch_settings() from public, anon;

grant usage on schema private to authenticated;
grant execute on function private.prepare_product() to authenticated;
grant execute on function private.touch_settings() to authenticated;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  slug text not null unique,
  sku text not null unique,
  price numeric(12, 2) check (price is null or price >= 0),
  original_price numeric(12, 2),
  manufacturer_url text,
  brand text,
  category text,
  sizes text[] not null default '{}',
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_original_price_check check (original_price is null or original_price >= 0)
);

alter table public.products add column if not exists original_price numeric(12, 2);
alter table public.products add column if not exists manufacturer_url text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_original_price_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_original_price_check
      check (original_price is null or original_price >= 0);
  end if;
end
$$;

create index if not exists products_created_at_idx
  on public.products (created_at desc);

drop trigger if exists products_prepare on public.products;
create trigger products_prepare
before insert or update on public.products
for each row execute function private.prepare_product();

create table if not exists public.shop_settings (
  id integer primary key default 1 check (id = 1),
  shop_name text not null default 'Global Atelier' check (char_length(btrim(shop_name)) > 0),
  whatsapp_number text not null default '',
  instagram_url text not null default '',
  updated_at timestamptz not null default now()
);

drop trigger if exists shop_settings_touch on public.shop_settings;
create trigger shop_settings_touch
before insert or update on public.shop_settings
for each row execute function private.touch_settings();

insert into public.shop_settings (id, shop_name, whatsapp_number, instagram_url)
values (1, 'Global Atelier', '', '')
on conflict (id) do nothing;

alter table public.products enable row level security;
alter table public.shop_settings enable row level security;

drop policy if exists products_select on public.products;
create policy products_select
on public.products
for select
to anon, authenticated
using (true);

drop policy if exists products_insert on public.products;
create policy products_insert
on public.products
for insert
to authenticated
with check (true);

drop policy if exists products_update on public.products;
create policy products_update
on public.products
for update
to authenticated
using (true)
with check (true);

drop policy if exists products_delete on public.products;
create policy products_delete
on public.products
for delete
to authenticated
using (true);

drop policy if exists shop_settings_select on public.shop_settings;
create policy shop_settings_select
on public.shop_settings
for select
to anon, authenticated
using (true);

drop policy if exists shop_settings_update on public.shop_settings;
create policy shop_settings_update
on public.shop_settings
for update
to authenticated
using (id = 1)
with check (id = 1);

revoke all on table public.products from anon, authenticated;
revoke all on table public.shop_settings from anon, authenticated;

grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

grant select on table public.shop_settings to anon, authenticated;
grant update on table public.shop_settings to authenticated;
