-- Migration pour ajouter le système d'administration sécurisé
-- Date: 2025-01-23
-- Description: Ajoute le champ is_admin à la table users et définit les premiers administrateurs

-- Ajouter le champ is_admin à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Créer un index pour optimiser les requêtes admin
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Définir les administrateurs initiaux
-- Note: Ces emails seront mis à jour automatiquement lors de la création des comptes
UPDATE users SET is_admin = TRUE WHERE email = 'johan.jublanc@gmail.com';
UPDATE users SET is_admin = TRUE WHERE email = 'admin@tidimondo.com';

-- Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION is_user_admin(p_clerk_user_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_status BOOLEAN := FALSE;
BEGIN
    SELECT is_admin INTO admin_status
    FROM users
    WHERE clerk_user_id = p_clerk_user_id;
    
    RETURN COALESCE(admin_status, FALSE);
END;
$$;

-- Fonction pour promouvoir un utilisateur en administrateur (seulement par un admin existant)
CREATE OR REPLACE FUNCTION promote_user_to_admin(
    p_target_email TEXT,
    p_admin_clerk_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_requester_admin BOOLEAN := FALSE;
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Vérifier que le demandeur est admin
    SELECT is_user_admin(p_admin_clerk_user_id) INTO is_requester_admin;
    
    IF NOT is_requester_admin THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent promouvoir d''autres utilisateurs';
    END IF;
    
    -- Vérifier que l'utilisateur cible existe
    SELECT EXISTS(SELECT 1 FROM users WHERE email = p_target_email) INTO user_exists;
    
    IF NOT user_exists THEN
        RAISE EXCEPTION 'Utilisateur avec l''email % non trouvé', p_target_email;
    END IF;
    
    -- Promouvoir l'utilisateur
    UPDATE users 
    SET is_admin = TRUE, updated_at = NOW()
    WHERE email = p_target_email;
    
    RETURN TRUE;
END;
$$;

-- Fonction pour révoquer les droits administrateur
CREATE OR REPLACE FUNCTION revoke_admin_rights(
    p_target_email TEXT,
    p_admin_clerk_user_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_requester_admin BOOLEAN := FALSE;
    admin_count INTEGER := 0;
BEGIN
    -- Vérifier que le demandeur est admin
    SELECT is_user_admin(p_admin_clerk_user_id) INTO is_requester_admin;
    
    IF NOT is_requester_admin THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent révoquer les droits administrateur';
    END IF;
    
    -- Compter le nombre d'admins restants
    SELECT COUNT(*) INTO admin_count FROM users WHERE is_admin = TRUE;
    
    -- Empêcher la suppression du dernier admin
    IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Impossible de supprimer le dernier administrateur';
    END IF;
    
    -- Révoquer les droits
    UPDATE users 
    SET is_admin = FALSE, updated_at = NOW()
    WHERE email = p_target_email;
    
    RETURN TRUE;
END;
$$;

-- Politique RLS pour les fonctions admin (seulement les admins peuvent voir qui est admin)
CREATE POLICY "Admins can view admin status" ON users
    FOR SELECT
    USING (
        is_admin = TRUE OR 
        clerk_user_id = auth.jwt() ->> 'sub' OR
        (SELECT is_user_admin(auth.jwt() ->> 'sub'))
    );

-- Commentaires pour la documentation
COMMENT ON COLUMN users.is_admin IS 'Indique si l''utilisateur a des droits d''administration';
COMMENT ON FUNCTION is_user_admin(TEXT) IS 'Vérifie si un utilisateur est administrateur de manière sécurisée';
COMMENT ON FUNCTION promote_user_to_admin(TEXT, TEXT) IS 'Permet à un admin de promouvoir un autre utilisateur';
COMMENT ON FUNCTION revoke_admin_rights(TEXT, TEXT) IS 'Permet à un admin de révoquer les droits d''un autre admin';