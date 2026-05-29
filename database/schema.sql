create extension if not exists "uuid-ossp";
create extension if not exists vector;

create table if not exists tracked_products (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  base_cost numeric(12, 2) not null check (base_cost > 0),
  current_price numeric(12, 2) not null check (current_price > 0),
  created_at timestamp with time zone not null default now()
);

alter table tracked_products enable row level security;

drop policy if exists "tracked_products_read" on tracked_products;
create policy "tracked_products_read"
  on tracked_products for select
  using (true);

create table if not exists competitor_products (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references tracked_products(id) on delete cascade,
  competitor_name text not null,
  title text,
  price numeric(12, 2) not null check (price > 0),
  currency text not null default 'USD',
  availability text,
  specs_summary text,
  color text,
  stock text,
  specifications jsonb not null default '{}'::jsonb,
  embedding vector(1536) not null,
  created_at timestamp with time zone not null default now()
);

alter table competitor_products add column if not exists title text;
alter table competitor_products add column if not exists currency text not null default 'USD';
alter table competitor_products add column if not exists availability text;
alter table competitor_products add column if not exists specs_summary text;
alter table competitor_products add column if not exists color text;
alter table competitor_products add column if not exists stock text;
alter table competitor_products add column if not exists specifications jsonb not null default '{}'::jsonb;

alter table competitor_products enable row level security;

drop policy if exists "competitor_products_read" on competitor_products;
create policy "competitor_products_read"
  on competitor_products for select
  using (true);

create table if not exists pricing_history (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references tracked_products(id) on delete cascade,
  old_price numeric(12, 2) not null check (old_price > 0),
  new_price numeric(12, 2) not null check (new_price > 0),
  competitor_price numeric(12, 2),
  triggered_by text not null,
  created_at timestamp with time zone not null default now()
);

alter table pricing_history add column if not exists competitor_price numeric(12, 2);

alter table pricing_history enable row level security;

drop policy if exists "mvp_pricing_history_read" on pricing_history;
create policy "mvp_pricing_history_read"
  on pricing_history for select
  using (true);

create table if not exists pricing_alerts (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references tracked_products(id) on delete set null,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  category text not null,
  message text not null,
  created_at timestamp with time zone not null default now()
);

alter table pricing_alerts enable row level security;

drop policy if exists "pricing_alerts_read" on pricing_alerts;
create policy "pricing_alerts_read"
  on pricing_alerts for select
  using (true);

create index if not exists competitor_products_embedding_hnsw_idx
  on competitor_products using hnsw (embedding vector_cosine_ops);

do $$
begin
  if to_regclass('public.internal_products') is not null
     and (select relkind from pg_class where oid = to_regclass('public.internal_products')) = 'r' then
    insert into tracked_products (id, title, base_cost, current_price, created_at)
    select id, title, base_cost, current_price, created_at
    from internal_products
    on conflict (id) do nothing;
  end if;
end $$;

do $$
begin
  if to_regclass('public.competitor_prices') is not null
     and (select relkind from pg_class where oid = to_regclass('public.competitor_prices')) = 'r' then
    insert into competitor_products (id, product_id, competitor_name, price, embedding, created_at)
    select id, product_id, competitor_name, price, embedding, created_at
    from competitor_prices
    on conflict (id) do nothing;
  end if;
end $$;

create or replace function match_products(
  sample_embedding vector(1536),
  similarity_threshold float default 0.22
)
returns table (
  product_id uuid,
  title text,
  distance float
)
language sql
stable
as $$
  select
    ip.id as product_id,
    ip.title,
    min(cp.embedding <=> sample_embedding) as distance
  from tracked_products ip
  join competitor_products cp on cp.product_id = ip.id
  group by ip.id, ip.title
  having min(cp.embedding <=> sample_embedding) <= similarity_threshold
  order by distance asc
  limit 5;
$$;

do $$
begin
  if to_regclass('public.competitor_prices') is not null then
    if (select relkind from pg_class where oid = to_regclass('public.competitor_prices')) = 'r' then
      drop table public.competitor_prices cascade;
    else
      drop view public.competitor_prices cascade;
    end if;
  end if;

  if to_regclass('public.internal_products') is not null then
    if (select relkind from pg_class where oid = to_regclass('public.internal_products')) = 'r' then
      drop table public.internal_products cascade;
    else
      drop view public.internal_products cascade;
    end if;
  end if;
end $$;

create view internal_products as
  select id, title, base_cost, current_price, created_at
  from tracked_products;

create view competitor_prices as
  select id, product_id, competitor_name, price, embedding, created_at
  from competitor_products;
