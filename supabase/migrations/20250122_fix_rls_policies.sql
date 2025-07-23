-- Fix RLS policies to work with Clerk JWT tokens
-- The auth.uid() function returns the 'sub' claim from JWT, which is the Clerk user ID

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;

-- Create new policies that work with Clerk user IDs
-- auth.uid() returns the 'sub' claim from the JWT, which is the Clerk user ID as text

create policy "Users can view own profile" on public.users
  for select using (clerk_user_id = auth.uid()::text);

create policy "Users can update own profile" on public.users
  for update using (clerk_user_id = auth.uid()::text);

create policy "Users can insert own profile" on public.users
  for insert with check (clerk_user_id = auth.uid()::text);

create policy "Users can view own subscriptions" on public.subscriptions
  for select using (
    exists (
      select 1 from public.users 
      where users.id = subscriptions.user_id 
      and users.clerk_user_id = auth.uid()::text
    )
  );