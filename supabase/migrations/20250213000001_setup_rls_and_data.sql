-- Migration TidiMondo - Configuration RLS et données de base
-- Date: 2025-02-13
-- Description: Configuration des politiques de sécurité et insertion des données de base

-- =====================================================
-- 1. ACTIVATION RLS
-- =====================================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ustensiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recette_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recette_ustensiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejours ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sejour_repas ENABLE ROW LEVEL SECURITY;
ALTER TABLE listes_courses ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. POLITIQUES RLS
-- =====================================================

-- Politiques pour ingredients et ustensiles (lecture publique)
CREATE POLICY "Lecture publique ingredients" ON ingredients
    FOR SELECT USING (true);

CREATE POLICY "Lecture publique ustensiles" ON ustensiles
    FOR SELECT USING (true);

-- Politiques pour recettes (propriétaire + publiques)
CREATE POLICY "Utilisateurs voient leurs recettes" ON recettes
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        ) OR is_public = true
    );

CREATE POLICY "Utilisateurs modifient leurs recettes" ON recettes
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Utilisateurs modifient leurs recettes update" ON recettes
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Utilisateurs suppriment leurs recettes" ON recettes
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Politiques pour recette_ingredients
CREATE POLICY "Accès via recette ingredients select" ON recette_ingredients
    FOR SELECT USING (
        recette_id IN (
            SELECT id FROM recettes WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            ) OR is_public = true
        )
    );

CREATE POLICY "Accès via recette ingredients modify" ON recette_ingredients
    FOR ALL USING (
        recette_id IN (
            SELECT id FROM recettes WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

-- Politiques pour recette_ustensiles
CREATE POLICY "Accès via recette ustensiles select" ON recette_ustensiles
    FOR SELECT USING (
        recette_id IN (
            SELECT id FROM recettes WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            ) OR is_public = true
        )
    );

CREATE POLICY "Accès via recette ustensiles modify" ON recette_ustensiles
    FOR ALL USING (
        recette_id IN (
            SELECT id FROM recettes WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

-- Politiques pour séjours (propriétaire uniquement)
CREATE POLICY "Utilisateurs voient leurs séjours" ON sejours
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Utilisateurs créent leurs séjours" ON sejours
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Utilisateurs modifient leurs séjours" ON sejours
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

CREATE POLICY "Utilisateurs suppriment leurs séjours" ON sejours
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
        )
    );

-- Politiques pour sejour_participants
CREATE POLICY "Accès via séjour participants" ON sejour_participants
    FOR ALL USING (
        sejour_id IN (
            SELECT id FROM sejours WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

-- Politiques pour sejour_repas
CREATE POLICY "Accès via séjour repas" ON sejour_repas
    FOR ALL USING (
        sejour_id IN (
            SELECT id FROM sejours WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

-- Politiques pour listes_courses
CREATE POLICY "Accès via séjour listes" ON listes_courses
    FOR ALL USING (
        sejour_id IN (
            SELECT id FROM sejours WHERE 
            user_id IN (
                SELECT id FROM users WHERE clerk_user_id = auth.uid()::text
            )
        )
    );

-- =====================================================
-- 3. DONNÉES DE BASE - INGRÉDIENTS
-- =====================================================

INSERT INTO ingredients (nom, unite_base, categorie, allergenes, prix_moyen_euro) VALUES
-- Féculents
('Farine de blé', 'g', 'feculent', ARRAY['gluten'], 0.002),
('Riz blanc', 'g', 'feculent', ARRAY[]::TEXT[], 0.003),
('Pâtes', 'g', 'feculent', ARRAY['gluten'], 0.004),
('Pomme de terre', 'piece', 'legume', ARRAY[]::TEXT[], 0.50),
('Pain', 'piece', 'feculent', ARRAY['gluten'], 1.20),
('Quinoa', 'g', 'feculent', ARRAY[]::TEXT[], 0.008),

-- Légumes
('Oignon', 'piece', 'legume', ARRAY[]::TEXT[], 0.30),
('Ail', 'piece', 'legume', ARRAY[]::TEXT[], 0.10),
('Tomate', 'piece', 'legume', ARRAY[]::TEXT[], 0.80),
('Carotte', 'piece', 'legume', ARRAY[]::TEXT[], 0.25),
('Courgette', 'piece', 'legume', ARRAY[]::TEXT[], 1.20),
('Poivron', 'piece', 'legume', ARRAY[]::TEXT[], 1.50),
('Salade verte', 'piece', 'legume', ARRAY[]::TEXT[], 1.80),
('Concombre', 'piece', 'legume', ARRAY[]::TEXT[], 1.00),
('Brocoli', 'piece', 'legume', ARRAY[]::TEXT[], 2.50),

-- Fruits
('Pomme', 'piece', 'fruit', ARRAY[]::TEXT[], 0.60),
('Banane', 'piece', 'fruit', ARRAY[]::TEXT[], 0.40),
('Orange', 'piece', 'fruit', ARRAY[]::TEXT[], 0.70),
('Citron', 'piece', 'fruit', ARRAY[]::TEXT[], 0.50),

-- Viandes
('Poulet', 'g', 'viande', ARRAY[]::TEXT[], 0.012),
('Bœuf', 'g', 'viande', ARRAY[]::TEXT[], 0.020),
('Porc', 'g', 'viande', ARRAY[]::TEXT[], 0.015),
('Jambon', 'g', 'viande', ARRAY[]::TEXT[], 0.025),

-- Poissons
('Saumon', 'g', 'poisson', ARRAY['poisson'], 0.030),
('Thon', 'g', 'poisson', ARRAY['poisson'], 0.025),
('Cabillaud', 'g', 'poisson', ARRAY['poisson'], 0.020),

-- Produits laitiers
('Lait', 'ml', 'produit_laitier', ARRAY['lactose'], 0.001),
('Beurre', 'g', 'produit_laitier', ARRAY['lactose'], 0.008),
('Fromage râpé', 'g', 'produit_laitier', ARRAY['lactose'], 0.015),
('Yaourt nature', 'piece', 'produit_laitier', ARRAY['lactose'], 0.80),
('Crème fraîche', 'ml', 'produit_laitier', ARRAY['lactose'], 0.005),

-- Œufs
('Œufs', 'piece', 'autre', ARRAY['oeuf'], 0.30),

-- Épices et condiments
('Sel', 'g', 'condiment', ARRAY[]::TEXT[], 0.001),
('Poivre', 'g', 'epice', ARRAY[]::TEXT[], 0.020),
('Huile d''olive', 'ml', 'condiment', ARRAY[]::TEXT[], 0.008),
('Vinaigre', 'ml', 'condiment', ARRAY[]::TEXT[], 0.003),
('Moutarde', 'g', 'condiment', ARRAY[]::TEXT[], 0.010),
('Herbes de Provence', 'g', 'epice', ARRAY[]::TEXT[], 0.050),
('Paprika', 'g', 'epice', ARRAY[]::TEXT[], 0.040),
('Cumin', 'g', 'epice', ARRAY[]::TEXT[], 0.060),

-- Autres
('Sucre', 'g', 'autre', ARRAY[]::TEXT[], 0.002),
('Miel', 'g', 'autre', ARRAY[]::TEXT[], 0.012),
('Chocolat noir', 'g', 'autre', ARRAY[]::TEXT[], 0.020);

-- =====================================================
-- 4. DONNÉES DE BASE - USTENSILES
-- =====================================================

INSERT INTO ustensiles (nom, categorie, obligatoire, description) VALUES
-- Cuisson
('Casserole', 'cuisson', true, 'Pour faire bouillir, mijoter'),
('Poêle', 'cuisson', true, 'Pour faire revenir, griller'),
('Four', 'cuisson', false, 'Pour cuire, gratiner, rôtir'),
('Plaque de cuisson', 'cuisson', true, 'Gaz ou électrique'),
('Cocotte', 'cuisson', false, 'Pour mijoter, braiser'),

-- Préparation
('Couteau', 'preparation', true, 'Couteau de cuisine'),
('Planche à découper', 'preparation', true, 'En bois ou plastique'),
('Saladier', 'preparation', false, 'Pour mélanger'),
('Fouet', 'preparation', false, 'Pour battre, émulsionner'),
('Spatule', 'preparation', false, 'Pour mélanger, retourner'),
('Râpe', 'preparation', false, 'Pour râper fromage, légumes'),
('Économe', 'preparation', false, 'Pour éplucher'),
('Passoire', 'preparation', false, 'Pour égoutter'),

-- Mesure
('Balance de cuisine', 'mesure', false, 'Pour peser les ingrédients'),
('Verre doseur', 'mesure', false, 'Pour mesurer les liquides'),
('Cuillères doseuses', 'mesure', false, 'Pour petites quantités'),

-- Service
('Assiettes', 'service', true, 'Pour servir'),
('Couverts', 'service', true, 'Fourchettes, couteaux, cuillères'),
('Verres', 'service', true, 'Pour les boissons'),
('Plat de service', 'service', false, 'Pour présenter');

-- =====================================================
-- 5. FONCTIONS UTILITAIRES POUR L'APPLICATION
-- =====================================================

-- Fonction pour compter les séjours d'un utilisateur (pour limitation freemium)
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

-- Fonction pour vérifier si un utilisateur peut créer un séjour
CREATE OR REPLACE FUNCTION can_create_sejour(user_clerk_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    is_pro BOOLEAN;
    sejour_count INTEGER;
BEGIN
    -- Vérifier si l'utilisateur est Pro
    SELECT subscription_status = 'active' INTO is_pro
    FROM users
    WHERE clerk_user_id = user_clerk_id;
    
    -- Si Pro, pas de limitation
    IF is_pro THEN
        RETURN true;
    END IF;
    
    -- Si gratuit, vérifier la limite
    SELECT count_user_sejours(user_clerk_id) INTO sejour_count;
    
    RETURN sejour_count < 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. VUES UTILES
-- =====================================================

-- Vue pour les recettes avec informations enrichies
CREATE VIEW recettes_enrichies AS
SELECT
    r.*,
    COALESCE(u.email, 'Utilisateur inconnu') AS auteur,
    COUNT(DISTINCT ri.ingredient_id) AS nombre_ingredients,
    COUNT(DISTINCT ru.ustensile_id) AS nombre_ustensiles,
    COALESCE(r.temps_preparation, 0) + COALESCE(r.temps_cuisson, 0) AS temps_total
FROM recettes r
LEFT JOIN users u ON r.user_id = u.id
LEFT JOIN recette_ingredients ri ON r.id = ri.recette_id
LEFT JOIN recette_ustensiles ru ON r.id = ru.recette_id
GROUP BY r.id, u.id, u.email;

-- Vue pour les séjours avec statistiques
CREATE VIEW sejours_stats AS
SELECT 
    s.*,
    COUNT(DISTINCT sp.id) AS nombre_participants_saisis,
    COUNT(DISTINCT sr.id) AS nombre_repas_planifies,
    COUNT(DISTINCT sr.date_repas) AS nombre_jours_avec_repas,
    SUM(sr.cout_estime) AS cout_total_repas
FROM sejours s
LEFT JOIN sejour_participants sp ON s.id = sp.sejour_id
LEFT JOIN sejour_repas sr ON s.id = sr.sejour_id
GROUP BY s.id;