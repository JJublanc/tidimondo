-- Migration TidiMondo - Phase 5 : Restrictions Freemium
-- Date: 2025-02-21
-- Description: Implémentation des restrictions freemium avec ajout des champs manquants et politiques RLS

-- =====================================================
-- 1. AJOUT DES CHAMPS MANQUANTS
-- =====================================================

-- Ajout des champs manquants à la table ingredients
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false;

-- Ajout des champs manquants à la table ustensiles
ALTER TABLE ustensiles 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false;

-- Ajout du champ created_by_admin à la table recettes (is_public existe déjà)
ALTER TABLE recettes 
ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT false;

-- =====================================================
-- 2. MISE À JOUR DES DONNÉES EXISTANTES
-- =====================================================

-- Marquer tous les ingrédients existants comme publics et créés par admin
UPDATE ingredients 
SET is_public = true, created_by_admin = true, user_id = NULL
WHERE created_by_admin IS NULL OR created_by_admin = false;

-- Marquer tous les ustensiles existants comme publics et créés par admin
UPDATE ustensiles 
SET is_public = true, created_by_admin = true, user_id = NULL
WHERE created_by_admin IS NULL OR created_by_admin = false;

-- Marquer toutes les recettes existantes comme créées par admin si elles sont publiques
UPDATE recettes 
SET created_by_admin = true
WHERE is_public = true AND (created_by_admin IS NULL OR created_by_admin = false);

-- =====================================================
-- 3. INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les nouveaux champs sur ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_user_id ON ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_is_public ON ingredients(is_public);
CREATE INDEX IF NOT EXISTS idx_ingredients_created_by_admin ON ingredients(created_by_admin);
CREATE INDEX IF NOT EXISTS idx_ingredients_user_public ON ingredients(user_id, is_public);

-- Index pour les nouveaux champs sur ustensiles
CREATE INDEX IF NOT EXISTS idx_ustensiles_user_id ON ustensiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ustensiles_is_public ON ustensiles(is_public);
CREATE INDEX IF NOT EXISTS idx_ustensiles_created_by_admin ON ustensiles(created_by_admin);
CREATE INDEX IF NOT EXISTS idx_ustensiles_user_public ON ustensiles(user_id, is_public);

-- Index pour le nouveau champ sur recettes
CREATE INDEX IF NOT EXISTS idx_recettes_created_by_admin ON recettes(created_by_admin);

-- =====================================================
-- 4. FONCTIONS DE COMPTAGE SÉCURISÉES POUR FREEMIUM
-- =====================================================

-- Fonction pour compter les recettes privées d'un utilisateur
CREATE OR REPLACE FUNCTION count_user_private_recettes(user_clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    recette_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO recette_count
    FROM recettes r
    JOIN users u ON r.user_id = u.id
    WHERE u.clerk_user_id = user_clerk_id 
    AND r.is_public = false;
    
    RETURN recette_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les ingrédients privés d'un utilisateur
CREATE OR REPLACE FUNCTION count_user_private_ingredients(user_clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    ingredient_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ingredient_count
    FROM ingredients i
    JOIN users u ON i.user_id = u.id
    WHERE u.clerk_user_id = user_clerk_id 
    AND i.is_public = false;
    
    RETURN ingredient_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les ustensiles privés d'un utilisateur
CREATE OR REPLACE FUNCTION count_user_private_ustensiles(user_clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    ustensile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ustensile_count
    FROM ustensiles u
    JOIN users us ON u.user_id = us.id
    WHERE us.clerk_user_id = user_clerk_id 
    AND u.is_public = false;
    
    RETURN ustensile_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur peut créer une recette privée
CREATE OR REPLACE FUNCTION can_create_private_recette(user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_pro BOOLEAN;
    recette_count INTEGER;
BEGIN
    -- Vérifier si l'utilisateur est Pro
    SELECT subscription_status = 'active' INTO is_pro
    FROM users
    WHERE clerk_user_id = user_clerk_id;
    
    -- Si Pro, pas de limitation
    IF is_pro THEN
        RETURN true;
    END IF;
    
    -- Si gratuit, vérifier la limite (5 recettes privées max)
    SELECT count_user_private_recettes(user_clerk_id) INTO recette_count;
    
    RETURN recette_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur peut créer un ingrédient privé
CREATE OR REPLACE FUNCTION can_create_private_ingredient(user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_pro BOOLEAN;
    ingredient_count INTEGER;
BEGIN
    -- Vérifier si l'utilisateur est Pro
    SELECT subscription_status = 'active' INTO is_pro
    FROM users
    WHERE clerk_user_id = user_clerk_id;
    
    -- Si Pro, pas de limitation
    IF is_pro THEN
        RETURN true;
    END IF;
    
    -- Si gratuit, vérifier la limite (10 ingrédients privés max)
    SELECT count_user_private_ingredients(user_clerk_id) INTO ingredient_count;
    
    RETURN ingredient_count < 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur peut créer un ustensile privé
CREATE OR REPLACE FUNCTION can_create_private_ustensile(user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_pro BOOLEAN;
    ustensile_count INTEGER;
BEGIN
    -- Vérifier si l'utilisateur est Pro
    SELECT subscription_status = 'active' INTO is_pro
    FROM users
    WHERE clerk_user_id = user_clerk_id;
    
    -- Si Pro, pas de limitation
    IF is_pro THEN
        RETURN true;
    END IF;
    
    -- Si gratuit, vérifier la limite (5 ustensiles privés max)
    SELECT count_user_private_ustensiles(user_clerk_id) INTO ustensile_count;
    
    RETURN ustensile_count < 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les séjours d'un utilisateur
CREATE OR REPLACE FUNCTION count_user_sejours(user_clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    sejour_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO sejour_count
    FROM sejours s
    JOIN users u ON s.user_id = u.id
    WHERE u.clerk_user_id = user_clerk_id;
    
    RETURN sejour_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. MISE À JOUR DES POLITIQUES RLS
-- =====================================================

-- Supprimer les anciennes politiques pour ingredients
DROP POLICY IF EXISTS "Lecture publique ingredients" ON ingredients;

-- Nouvelles politiques pour ingredients avec restrictions freemium
CREATE POLICY "Lecture ingredients publics et privés utilisateur" ON ingredients
    FOR SELECT USING (
        is_public = true 
        OR user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Création ingredients par utilisateur" ON ingredients
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
        AND (
            is_public = true 
            OR can_create_private_ingredient(auth.uid()::text)
        )
    );

CREATE POLICY "Modification ingredients par propriétaire" ON ingredients
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Suppression ingredients par propriétaire" ON ingredients
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
        AND created_by_admin = false
    );

-- Supprimer les anciennes politiques pour ustensiles
DROP POLICY IF EXISTS "Lecture publique ustensiles" ON ustensiles;

-- Nouvelles politiques pour ustensiles avec restrictions freemium
CREATE POLICY "Lecture ustensiles publics et privés utilisateur" ON ustensiles
    FOR SELECT USING (
        is_public = true 
        OR user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Création ustensiles par utilisateur" ON ustensiles
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
        AND (
            is_public = true 
            OR can_create_private_ustensile(auth.uid()::text)
        )
    );

CREATE POLICY "Modification ustensiles par propriétaire" ON ustensiles
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Suppression ustensiles par propriétaire" ON ustensiles
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
        AND created_by_admin = false
    );

-- Mise à jour des politiques pour recettes avec restrictions freemium
DROP POLICY IF EXISTS "Utilisateurs modifient leurs recettes" ON recettes;

CREATE POLICY "Création recettes par utilisateur" ON recettes
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
        AND (
            is_public = true 
            OR can_create_private_recette(auth.uid()::text)
        )
    );

-- =====================================================
-- 6. VUES MISES À JOUR
-- =====================================================

-- Mise à jour de la vue recettes_enrichies pour inclure les nouveaux champs
DROP VIEW IF EXISTS recettes_enrichies;

CREATE VIEW recettes_enrichies AS
SELECT
    r.*,
    COALESCE(u.email, 'Utilisateur inconnu') AS auteur,
    COUNT(DISTINCT ri.ingredient_id) AS nombre_ingredients,
    COUNT(DISTINCT ru.ustensile_id) AS nombre_ustensiles,
    COALESCE(r.temps_preparation, 0) + COALESCE(r.temps_cuisson, 0) AS temps_total,
    CASE 
        WHEN r.created_by_admin THEN 'Admin'
        WHEN r.is_public THEN 'Public'
        ELSE 'Privé'
    END AS type_recette
FROM recettes r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN recette_ingredients ri ON r.id = ri.recette_id
LEFT JOIN recette_ustensiles ru ON r.id = ru.recette_id
GROUP BY r.id, u.id, u.email;

-- Vue pour les statistiques freemium d'un utilisateur
CREATE VIEW user_freemium_stats AS
SELECT 
    u.id,
    u.clerk_user_id,
    u.email,
    u.subscription_status,
    COUNT(DISTINCT s.id) AS total_sejours,
    COUNT(DISTINCT CASE WHEN r.is_public = false THEN r.id END) AS recettes_privees,
    COUNT(DISTINCT CASE WHEN i.is_public = false THEN i.id END) AS ingredients_prives,
    COUNT(DISTINCT CASE WHEN us.is_public = false THEN us.id END) AS ustensiles_prives,
    CASE 
        WHEN u.subscription_status = 'active' THEN 'Pro'
        ELSE 'Gratuit'
    END AS plan_type
FROM users u
LEFT JOIN sejours s ON u.id = s.user_id
LEFT JOIN recettes r ON u.id = r.user_id
LEFT JOIN ingredients i ON u.id = i.user_id
LEFT JOIN ustensiles us ON u.id = us.user_id
GROUP BY u.id, u.clerk_user_id, u.email, u.subscription_status;

-- =====================================================
-- 7. TRIGGERS POUR LES NOUVEAUX CHAMPS
-- =====================================================

-- Trigger pour auto-normalisation des noms d'ingrédients (mise à jour)
CREATE OR REPLACE FUNCTION auto_normaliser_ingredient()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nom_normalise = normaliser_nom(NEW.nom);
    
    -- Si user_id est fourni mais is_public n'est pas défini, définir comme privé par défaut
    IF NEW.user_id IS NOT NULL AND NEW.is_public IS NULL THEN
        NEW.is_public = false;
    END IF;
    
    -- Si pas de user_id, forcer comme public et admin
    IF NEW.user_id IS NULL THEN
        NEW.is_public = true;
        NEW.created_by_admin = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour auto-normalisation des noms d'ustensiles (mise à jour)
CREATE OR REPLACE FUNCTION auto_normaliser_ustensile()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nom_normalise = normaliser_nom(NEW.nom);
    
    -- Si user_id est fourni mais is_public n'est pas défini, définir comme privé par défaut
    IF NEW.user_id IS NOT NULL AND NEW.is_public IS NULL THEN
        NEW.is_public = false;
    END IF;
    
    -- Si pas de user_id, forcer comme public et admin
    IF NEW.user_id IS NULL THEN
        NEW.is_public = true;
        NEW.created_by_admin = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les recettes (mise à jour)
CREATE OR REPLACE FUNCTION auto_normaliser_recette()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nom_normalise = normaliser_nom(NEW.nom);
    
    -- Si is_public n'est pas défini, définir comme privé par défaut
    IF NEW.is_public IS NULL THEN
        NEW.is_public = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. COMMENTAIRES POUR LA DOCUMENTATION
-- =====================================================

COMMENT ON COLUMN ingredients.user_id IS 'Propriétaire de l''ingrédient (NULL pour les ingrédients admin)';
COMMENT ON COLUMN ingredients.is_public IS 'Ingrédient visible par tous les utilisateurs';
COMMENT ON COLUMN ingredients.created_by_admin IS 'Ingrédient créé par l''administration';

COMMENT ON COLUMN ustensiles.user_id IS 'Propriétaire de l''ustensile (NULL pour les ustensiles admin)';
COMMENT ON COLUMN ustensiles.is_public IS 'Ustensile visible par tous les utilisateurs';
COMMENT ON COLUMN ustensiles.created_by_admin IS 'Ustensile créé par l''administration';

COMMENT ON COLUMN recettes.created_by_admin IS 'Recette créée par l''administration';

COMMENT ON FUNCTION count_user_private_recettes(TEXT) IS 'Compte les recettes privées d''un utilisateur';
COMMENT ON FUNCTION count_user_private_ingredients(TEXT) IS 'Compte les ingrédients privés d''un utilisateur';
COMMENT ON FUNCTION count_user_private_ustensiles(TEXT) IS 'Compte les ustensiles privés d''un utilisateur';
COMMENT ON FUNCTION can_create_private_recette(TEXT) IS 'Vérifie si un utilisateur peut créer une recette privée (limite freemium)';
COMMENT ON FUNCTION can_create_private_ingredient(TEXT) IS 'Vérifie si un utilisateur peut créer un ingrédient privé (limite freemium)';
COMMENT ON FUNCTION can_create_private_ustensile(TEXT) IS 'Vérifie si un utilisateur peut créer un ustensile privé (limite freemium)';

-- =====================================================
-- 9. VALIDATION DE LA MIGRATION
-- =====================================================

-- Vérifier que tous les ingrédients existants ont été mis à jour
DO $$
DECLARE
    ingredient_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ingredient_count
    FROM ingredients
    WHERE created_by_admin IS NULL;
    
    IF ingredient_count > 0 THEN
        RAISE EXCEPTION 'Migration incomplète : % ingrédients sans created_by_admin', ingredient_count;
    END IF;
    
    RAISE NOTICE 'Migration réussie : tous les ingrédients ont été mis à jour';
END $$;

-- Vérifier que tous les ustensiles existants ont été mis à jour
DO $$
DECLARE
    ustensile_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ustensile_count
    FROM ustensiles
    WHERE created_by_admin IS NULL;
    
    IF ustensile_count > 0 THEN
        RAISE EXCEPTION 'Migration incomplète : % ustensiles sans created_by_admin', ustensile_count;
    END IF;
    
    RAISE NOTICE 'Migration réussie : tous les ustensiles ont été mis à jour';
END $$;

-- Afficher un résumé de la migration
DO $$
DECLARE
    total_ingredients INTEGER;
    total_ustensiles INTEGER;
    total_recettes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_ingredients FROM ingredients;
    SELECT COUNT(*) INTO total_ustensiles FROM ustensiles;
    SELECT COUNT(*) INTO total_recettes FROM recettes;
    
    RAISE NOTICE '=== RÉSUMÉ DE LA MIGRATION PHASE 5 ===';
    RAISE NOTICE 'Ingrédients traités : %', total_ingredients;
    RAISE NOTICE 'Ustensiles traités : %', total_ustensiles;
    RAISE NOTICE 'Recettes traitées : %', total_recettes;
    RAISE NOTICE 'Restrictions freemium activées';
    RAISE NOTICE 'Politiques RLS mises à jour';
    RAISE NOTICE '=====================================';
END $$;