-- Migration pour stratégie RLS hybride : 
-- - Permettre création d'utilisateurs côté client
-- - Bloquer lecture côté client (sécurité)
-- - Maintenir RLS pour autres opérations

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users" ON public.users;

-- 1. POLITIQUE D'INSERTION : Permissive pour auto-création
CREATE POLICY "Allow user self-registration" ON public.users
  FOR INSERT 
  WITH CHECK (
    -- Permettre l'insertion si l'utilisateur est authentifié ET
    -- que le clerk_user_id correspond au JWT sub claim
    auth.jwt() ->> 'sub' IS NOT NULL AND
    clerk_user_id = auth.jwt() ->> 'sub'
  );

-- 2. POLITIQUE DE LECTURE : BLOQUÉE côté client (sécurité)
-- Seules les API routes avec service_role peuvent lire
CREATE POLICY "Block client reads" ON public.users
  FOR SELECT 
  USING (false); -- Toujours false = aucune lecture côté client

-- 3. POLITIQUE DE MISE À JOUR : Restrictive (seulement son propre profil)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE 
  USING (
    auth.jwt() ->> 'sub' IS NOT NULL AND
    clerk_user_id = auth.jwt() ->> 'sub'
  );

-- 4. POLITIQUE DE SUPPRESSION : Bloquée (sécurité)
CREATE POLICY "Block user deletion" ON public.users
  FOR DELETE 
  USING (false); -- Aucune suppression côté client

-- Fonction helper pour vérifier si un utilisateur existe (côté serveur)
CREATE OR REPLACE FUNCTION public.user_exists(clerk_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Exécuté avec privilèges élevés
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE clerk_user_id = clerk_id
  );
END;
$$;

-- Fonction pour créer un utilisateur (côté client sécurisé)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_clerk_user_id text,
  p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER -- Exécuté avec privilèges de l'utilisateur
AS $$
DECLARE
  result_user public.users%ROWTYPE;
BEGIN
  -- Vérifier que l'utilisateur authentifié correspond
  IF auth.jwt() ->> 'sub' != p_clerk_user_id THEN
    RAISE EXCEPTION 'Unauthorized: clerk_user_id mismatch';
  END IF;

  -- Insérer ou récupérer l'utilisateur
  INSERT INTO public.users (clerk_user_id, email, subscription_status)
  VALUES (p_clerk_user_id, p_email, 'free')
  ON CONFLICT (clerk_user_id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = now()
  RETURNING * INTO result_user;

  -- Retourner seulement les infos nécessaires
  RETURN json_build_object(
    'id', result_user.id,
    'clerk_user_id', result_user.clerk_user_id,
    'subscription_status', result_user.subscription_status,
    'created_at', result_user.created_at
  );
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.user_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text) TO authenticated;