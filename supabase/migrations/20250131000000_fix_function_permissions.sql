-- Correction des permissions pour la fonction create_user_profile
-- et simplification de la stratégie RLS

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.create_user_profile(text, text);

-- Recréer la fonction avec les bonnes permissions
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_clerk_user_id text,
  p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Exécuté avec privilèges élevés (important!)
SET search_path = public
AS $$
DECLARE
  result_user public.users%ROWTYPE;
  jwt_sub text;
BEGIN
  -- Récupérer le subject du JWT
  jwt_sub := auth.jwt() ->> 'sub';
  
  -- Vérifier que l'utilisateur authentifié correspond
  IF jwt_sub IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No JWT token';
  END IF;
  
  IF jwt_sub != p_clerk_user_id THEN
    RAISE EXCEPTION 'Unauthorized: clerk_user_id mismatch. Expected: %, Got: %', jwt_sub, p_clerk_user_id;
  END IF;

  -- Insérer ou récupérer l'utilisateur
  INSERT INTO public.users (clerk_user_id, email, subscription_status)
  VALUES (p_clerk_user_id, p_email, 'free')
  ON CONFLICT (clerk_user_id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    updated_at = now()
  RETURNING * INTO result_user;

  -- Retourner toutes les infos nécessaires pour l'abonnement
  RETURN json_build_object(
    'id', result_user.id,
    'clerk_user_id', result_user.clerk_user_id,
    'subscription_status', result_user.subscription_status,
    'current_period_end', result_user.current_period_end,
    'stripe_customer_id', result_user.stripe_customer_id,
    'created_at', result_user.created_at
  );
END;
$$;

-- Accorder les permissions explicites
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text) TO anon;

-- Simplifier les politiques RLS pour être plus permissives pour l'insertion
DROP POLICY IF EXISTS "Allow user self-registration" ON public.users;

-- Nouvelle politique d'insertion plus simple
CREATE POLICY "Allow authenticated user creation" ON public.users
  FOR INSERT 
  WITH CHECK (
    -- Permettre l'insertion si l'utilisateur est authentifié
    auth.jwt() ->> 'sub' IS NOT NULL
  );

-- Politique de lecture : toujours bloquée côté client (sécurité)
-- (déjà créée dans la migration précédente)

-- Politique de mise à jour : restrictive (seulement son propre profil)
-- (déjà créée dans la migration précédente)

-- Politique de suppression : bloquée (sécurité)
-- (déjà créée dans la migration précédente)

-- Fonction helper pour debug (optionnelle)
CREATE OR REPLACE FUNCTION public.debug_jwt()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN json_build_object(
    'jwt_exists', auth.jwt() IS NOT NULL,
    'sub', auth.jwt() ->> 'sub',
    'iss', auth.jwt() ->> 'iss',
    'aud', auth.jwt() ->> 'aud'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.debug_jwt() TO authenticated;