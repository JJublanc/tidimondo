-- Script pour créer un utilisateur test avec le clerk_uuid du token
-- supabase_id du token: 72d72d73-72d7-4d73-72d7-2d7372d72d73

INSERT INTO public.users (
  clerk_user_id,
  clerk_uuid,
  email,
  first_name,
  last_name,
  subscription_status,
  created_at,
  updated_at
) VALUES (
  'user_301CMDwvclpsXhToFLBRAO8r4Bz',
  '72d72d73-72d7-4d73-72d7-2d7372d72d73',
  'johan.jublanc@gmail.com',
  'Johan',
  'Jublanc',
  'inactive',
  NOW(),
  NOW()
) ON CONFLICT (clerk_user_id) DO UPDATE SET
  clerk_uuid = EXCLUDED.clerk_uuid,
  email = EXCLUDED.email,
  updated_at = NOW();