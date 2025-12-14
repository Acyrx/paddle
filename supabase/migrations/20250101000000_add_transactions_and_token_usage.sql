-- Create transactions table to store all Paddle transactions
create table if not exists public.transactions (
  id uuid not null default gen_random_uuid(),
  transaction_id text not null,
  user_id uuid null,
  customer_id text not null,
  subscription_id text null,
  status text not null,
  amount text null,
  currency_code text null,
  billing_period text null,
  price_id text null,
  product_id text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint transactions_pkey primary key (id),
  constraint transactions_transaction_id_key unique (transaction_id),
  constraint transactions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint transactions_customer_id_fkey foreign key (customer_id) references public.customers (customer_id) on delete cascade
) tablespace pg_default;

-- Create index on transaction_id for fast lookups
create index if not exists idx_transactions_transaction_id on public.transactions using btree (transaction_id) tablespace pg_default;

-- Create index on user_id for user-specific queries
create index if not exists idx_transactions_user_id on public.transactions using btree (user_id) tablespace pg_default;

-- Create index on customer_id for customer-specific queries
create index if not exists idx_transactions_customer_id on public.transactions using btree (customer_id) tablespace pg_default;

-- Create token_usage table
create table if not exists public.token_usage (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  month text not null,
  tokens_used integer null default 0,
  token_limit integer null default 50000,
  last_reset_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint token_usage_pkey primary key (id),
  constraint token_usage_user_id_month_key unique (user_id, month),
  constraint token_usage_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
) tablespace pg_default;

-- Create index on user_id and month for fast lookups
create index if not exists idx_token_usage_user_month on public.token_usage using btree (user_id, month) tablespace pg_default;

-- Create trigger to update updated_at column for transactions
create trigger update_transactions_updated_at
  before update on public.transactions
  for each row
  execute function update_updated_at_column();

-- Create trigger to update updated_at column for token_usage
create trigger update_token_usage_updated_at
  before update on public.token_usage
  for each row
  execute function update_updated_at_column();

-- Function to get user_id from email
create or replace function public.get_user_id_from_email(user_email text)
returns uuid
language plpgsql
security definer
as $$
declare
  user_uuid uuid;
begin
  select id into user_uuid
  from auth.users
  where email = user_email
  limit 1;
  
  return user_uuid;
end;
$$;

-- Function to get token limit from price_id
-- Pro: 5,000,000 tokens (pri_01kcdrdmyams9kk94qypmzds7m, pri_01kcdrtdy74pj77ejrwmd90hqs)
-- Advanced: 1,000,000 tokens (pri_01kcdrjkt176fqaypy6w6637hk, pri_01kcdrqxhbxphw2x4ajmzmy61r)
-- Starter: 50,000 tokens (default, pri_01hsxyh9txq4rzbrhbyngkhy46)
create or replace function public.get_token_limit_from_price_id(price_id_param text)
returns integer
language plpgsql
as $$
begin
  case price_id_param
    when 'pri_01kcdrdmyams9kk94qypmzds7m' then return 5000000; -- Pro monthly
    when 'pri_01kcdrtdy74pj77ejrwmd90hqs' then return 5000000; -- Pro yearly
    when 'pri_01kcdrjkt176fqaypy6w6637hk' then return 1000000; -- Advanced monthly
    when 'pri_01kcdrqxhbxphw2x4ajmzmy61r' then return 1000000; -- Advanced yearly
    else return 50000; -- Starter (default)
  end case;
end;
$$;

-- Grant access to authenticated users
create policy "Enable read access for authenticated users to transactions" 
  on public.transactions 
  as permissive 
  for select 
  to authenticated 
  using (true);

create policy "Enable read access for authenticated users to token_usage" 
  on public.token_usage 
  as permissive 
  for select 
  to authenticated 
  using (auth.uid() = user_id);

create policy "Enable update access for authenticated users to token_usage" 
  on public.token_usage 
  as permissive 
  for update 
  to authenticated 
  using (auth.uid() = user_id);

