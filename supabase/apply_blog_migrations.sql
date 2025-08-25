-- Script pour appliquer les migrations du blog sur Supabase Cloud
-- À exécuter dans l'ordre dans le SQL Editor de Supabase Dashboard

-- =====================================================
-- ÉTAPE 1: Ajouter le système d'administration
-- =====================================================
-- Copier et exécuter le contenu de: 20250821000000_add_admin_role.sql

-- Ajouter le champ is_admin à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Créer un index pour optimiser les requêtes admin
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Définir les administrateurs initiaux
-- Note: Ces emails seront mis à jour automatiquement lors de la création des comptes
UPDATE users SET is_admin = TRUE WHERE email = 'jjublanc@gmail.com';
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

-- =====================================================
-- ÉTAPE 2: Vérifier que l'étape 1 a fonctionné
-- =====================================================
-- Exécuter cette requête pour vérifier :
-- SELECT email, is_admin FROM users WHERE email = 'jjublanc@gmail.com';

-- =====================================================
-- ÉTAPE 3: Appliquer les migrations du blog
-- =====================================================
-- Une fois l'étape 1 terminée avec succès, 
-- copier et exécuter le contenu de: 20250822000000_create_blog_schema.sql
-- puis: 20250822000001_blog_freemium_functions.sql

-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================
-- 1. Connectez-vous à supabase.com
-- 2. Sélectionnez votre projet TidiMondo
-- 3. Allez dans "SQL Editor"
-- 4. Copiez et exécutez ÉTAPE 1 ci-dessus
-- 5. Vérifiez avec la requête de l'ÉTAPE 2
-- 6. Si OK, exécutez les fichiers de l'ÉTAPE 3 dans l'ordre