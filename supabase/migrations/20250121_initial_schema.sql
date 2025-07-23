-- Initial schema migration
-- Created: 2025-01-21

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text unique not null,
  email text not null,
  first_name text,
  last_name text,
  avatar_url text,
  subscription_status text default 'inactive',
  subscription_id text,
  customer_id text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  status text not null,
  price_id text not null,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;

-- RLS Policies for users table
create policy "Users can view own profile" on public.users
  for select using (auth.uid()::text = clerk_user_id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid()::text = clerk_user_id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid()::text = clerk_user_id);

-- RLS Policies for subscriptions table
create policy "Users can view own subscriptions" on public.subscriptions
  for select using (
    exists (
      select 1 from public.users 
      where users.id = subscriptions.user_id 
      and users.clerk_user_id = auth.uid()::text
    )
  );

-- Create indexes for performance
create index if not exists idx_users_clerk_user_id on public.users(clerk_user_id);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);
create index if not exists idx_subscriptions_stripe_id on public.subscriptions(stripe_subscription_id);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger handle_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();