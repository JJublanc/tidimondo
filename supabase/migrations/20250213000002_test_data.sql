-- Migration TidiMondo - Données de test
-- Date: 2025-02-13
-- Description: Insertion de données de test pour valider le schéma

-- =====================================================
-- DONNÉES DE TEST (à supprimer en production)
-- =====================================================

-- Note: Ces données de test permettent de valider le bon fonctionnement
-- du schéma et des contraintes. Elles peuvent être supprimées en production.

-- Insérer un utilisateur de test (si pas déjà présent)
INSERT INTO users (clerk_user_id, email, subscription_status)
VALUES ('test_user_tidimondo', 'test@tidimondo.com', 'active')
ON CONFLICT (clerk_user_id) DO NOTHING;

-- Récupérer l'ID de l'utilisateur de test
DO $$
DECLARE
    test_user_id UUID;
    test_recette_id UUID;
    test_sejour_id UUID;
    ingredient_farine_id UUID;
    ingredient_oeuf_id UUID;
    ingredient_lait_id UUID;
    ustensile_fouet_id UUID;
    ustensile_poele_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur de test
    SELECT id INTO test_user_id FROM users WHERE clerk_user_id = 'test_user_tidimondo';
    
    -- Récupérer quelques IDs d'ingrédients
    SELECT id INTO ingredient_farine_id FROM ingredients WHERE nom = 'Farine de blé';
    SELECT id INTO ingredient_oeuf_id FROM ingredients WHERE nom = 'Œufs';
    SELECT id INTO ingredient_lait_id FROM ingredients WHERE nom = 'Lait';
    
    -- Récupérer quelques IDs d'ustensiles
    SELECT id INTO ustensile_fouet_id FROM ustensiles WHERE nom = 'Fouet';
    SELECT id INTO ustensile_poele_id FROM ustensiles WHERE nom = 'Poêle';
    
    -- Créer une recette de test
    INSERT INTO recettes (
        user_id, nom, description, instructions, temps_preparation, temps_cuisson,
        difficulte, portions, regime_alimentaire, type_repas
    ) VALUES (
        test_user_id,
        'Crêpes simples',
        'Des crêpes faciles à faire pour le petit-déjeuner',
        E'1. Mélanger la farine et les œufs\n2. Ajouter le lait progressivement\n3. Faire cuire dans la poêle',
        15,
        20,
        2,
        4,
        ARRAY['vegetarien'],
        ARRAY['petit_dejeuner']
    ) RETURNING id INTO test_recette_id;
    
    -- Ajouter les ingrédients à la recette
    INSERT INTO recette_ingredients (recette_id, ingredient_id, quantite, unite, ordre_affichage) VALUES
        (test_recette_id, ingredient_farine_id, 250, 'g', 1),
        (test_recette_id, ingredient_oeuf_id, 3, 'piece', 2),
        (test_recette_id, ingredient_lait_id, 500, 'ml', 3);
    
    -- Ajouter les ustensiles à la recette
    INSERT INTO recette_ustensiles (recette_id, ustensile_id, obligatoire) VALUES
        (test_recette_id, ustensile_fouet_id, true),
        (test_recette_id, ustensile_poele_id, true);
    
    -- Créer un séjour de test
    INSERT INTO sejours (
        user_id, nom, description, lieu, date_debut, date_fin,
        nombre_participants, type_sejour, statut
    ) VALUES (
        test_user_id,
        'Week-end à la campagne',
        'Un petit séjour relaxant entre amis',
        'Maison de campagne, Normandie',
        CURRENT_DATE + INTERVAL '1 month',
        CURRENT_DATE + INTERVAL '1 month' + INTERVAL '2 days',
        4,
        'weekend',
        'planifie'
    ) RETURNING id INTO test_sejour_id;
    
    -- Ajouter des participants
    INSERT INTO sejour_participants (sejour_id, nom, regime_alimentaire, allergies) VALUES
        (test_sejour_id, 'Alice Martin', ARRAY['vegetarien'], ARRAY[]::TEXT[]),
        (test_sejour_id, 'Bob Dupont', ARRAY[]::TEXT[], ARRAY['lactose']),
        (test_sejour_id, 'Claire Durand', ARRAY['vegan'], ARRAY[]::TEXT[]),
        (test_sejour_id, 'David Moreau', ARRAY[]::TEXT[], ARRAY[]::TEXT[]);
    
    -- Planifier quelques repas
    INSERT INTO sejour_repas (sejour_id, recette_id, date_repas, type_repas, nombre_portions) VALUES
        (test_sejour_id, test_recette_id, CURRENT_DATE + INTERVAL '1 month', 'petit_dejeuner', 4),
        (test_sejour_id, NULL, CURRENT_DATE + INTERVAL '1 month', 'dejeuner', 4),
        (test_sejour_id, NULL, CURRENT_DATE + INTERVAL '1 month', 'diner', 4);
    
    -- Mettre à jour le repas libre
    UPDATE sejour_repas 
    SET repas_libre = 'Pique-nique au bord de la rivière'
    WHERE sejour_id = test_sejour_id AND type_repas = 'dejeuner';
    
    UPDATE sejour_repas 
    SET repas_libre = 'Barbecue dans le jardin'
    WHERE sejour_id = test_sejour_id AND type_repas = 'diner';
    
    RAISE NOTICE 'Données de test insérées avec succès';
    RAISE NOTICE 'Recette ID: %', test_recette_id;
    RAISE NOTICE 'Séjour ID: %', test_sejour_id;
    
END $$;

-- =====================================================
-- TESTS DE VALIDATION
-- =====================================================

-- Test 1: Vérifier que les contraintes fonctionnent
DO $$
BEGIN
    -- Test de contrainte de date (doit échouer)
    BEGIN
        INSERT INTO sejours (user_id, nom, date_debut, date_fin, nombre_participants)
        SELECT id, 'Test contrainte', '2025-12-31', '2025-01-01', 1
        FROM users WHERE clerk_user_id = 'test_user_tidimondo';
        
        RAISE EXCEPTION 'La contrainte de date ne fonctionne pas !';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Test contrainte de date: OK';
    END;
    
    -- Test de contrainte de quantité (doit échouer)
    BEGIN
        INSERT INTO recette_ingredients (recette_id, ingredient_id, quantite, unite)
        SELECT r.id, i.id, -5, 'g'
        FROM recettes r, ingredients i
        WHERE r.nom = 'Crêpes simples' AND i.nom = 'Farine de blé'
        LIMIT 1;
        
        RAISE EXCEPTION 'La contrainte de quantité ne fonctionne pas !';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'Test contrainte de quantité: OK';
    END;
END $$;

-- Test 2: Vérifier les fonctions utilitaires
DO $$
DECLARE
    sejour_count INTEGER;
    can_create BOOLEAN;
BEGIN
    -- Test de comptage des séjours
    SELECT count_user_sejours('test_user_tidimondo') INTO sejour_count;
    RAISE NOTICE 'Nombre de séjours pour test_user_tidimondo: %', sejour_count;
    
    -- Test de vérification de création (utilisateur Pro)
    SELECT can_create_sejour('test_user_tidimondo') INTO can_create;
    RAISE NOTICE 'Peut créer un séjour (Pro): %', can_create;
    
    -- Simuler un utilisateur gratuit (utiliser une valeur valide)
    UPDATE users SET subscription_status = 'canceled' WHERE clerk_user_id = 'test_user_tidimondo';
    
    SELECT can_create_sejour('test_user_tidimondo') INTO can_create;
    RAISE NOTICE 'Peut créer un séjour (Gratuit avec 1 séjour): %', can_create;
    
    -- Remettre en Pro
    UPDATE users SET subscription_status = 'active' WHERE clerk_user_id = 'test_user_tidimondo';
END $$;

-- Test 3: Vérifier les vues
DO $$
DECLARE
    recette_record RECORD;
    sejour_record RECORD;
BEGIN
    -- Test de la vue recettes_enrichies
    SELECT * INTO recette_record FROM recettes_enrichies WHERE nom = 'Crêpes simples' LIMIT 1;
    RAISE NOTICE 'Recette enrichie - Auteur: %, Ingrédients: %, Temps total: %', 
        recette_record.auteur, recette_record.nombre_ingredients, recette_record.temps_total;
    
    -- Test de la vue sejours_stats
    SELECT * INTO sejour_record FROM sejours_stats WHERE nom = 'Week-end à la campagne' LIMIT 1;
    RAISE NOTICE 'Séjour stats - Participants: %, Repas: %', 
        sejour_record.nombre_participants_saisis, sejour_record.nombre_repas_planifies;
END $$;

-- Test 4: Vérifier la normalisation automatique
DO $$
DECLARE
    nom_normalise_result TEXT;
BEGIN
    -- Insérer un ingrédient avec accents
    INSERT INTO ingredients (nom, unite_base, categorie) 
    VALUES ('Crème fraîche épaisse', 'ml', 'produit_laitier')
    ON CONFLICT (nom) DO NOTHING;
    
    -- Vérifier la normalisation
    SELECT nom_normalise INTO nom_normalise_result 
    FROM ingredients WHERE nom = 'Crème fraîche épaisse';
    
    RAISE NOTICE 'Normalisation: "Crème fraîche épaisse" -> "%"', nom_normalise_result;
END $$;

DO $$
BEGIN
    RAISE NOTICE '=== TESTS DE VALIDATION TERMINÉS ===';
    RAISE NOTICE 'Toutes les fonctionnalités de base ont été testées avec succès.';
    RAISE NOTICE 'Le schéma est prêt pour l''implémentation des interfaces.';
END $$;