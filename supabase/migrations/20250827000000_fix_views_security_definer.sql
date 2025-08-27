-- Migration pour corriger les vues SECURITY DEFINER
-- Date: 2025-08-27
-- Description: Conversion des vues en SECURITY INVOKER pour respecter les politiques RLS

-- =====================================================
-- CORRECTION DES 4 VUES - SECURITY INVOKER
-- =====================================================

-- 1. Supprimer et recréer blog_articles_with_metadata avec SECURITY INVOKER
DROP VIEW IF EXISTS blog_articles_with_metadata;

CREATE VIEW blog_articles_with_metadata 
WITH (security_invoker = true) AS
SELECT
  a.*,
  c.name as category_name,
  c.slug as category_slug,
  c.color as category_color,
  (
    SELECT COUNT(*)
    FROM blog_comments
    WHERE article_id = a.id AND status = 'approved'
  ) as comments_count,
  (
    SELECT array_agg(
      json_build_object(
        'id', t.id,
        'name', t.name,
        'slug', t.slug,
        'color', t.color
      )
    )
    FROM blog_tags t
    JOIN blog_article_tags at ON t.id = at.tag_id
    WHERE at.article_id = a.id
  ) as tags
FROM blog_articles a
LEFT JOIN blog_categories c ON a.category_id = c.id;

-- 2. Supprimer et recréer blog_stats avec SECURITY INVOKER
DROP VIEW IF EXISTS blog_stats;

CREATE VIEW blog_stats 
WITH (security_invoker = true) AS
SELECT 
  (SELECT COUNT(*) FROM blog_articles WHERE status = 'published') as published_articles,
  (SELECT COUNT(*) FROM blog_articles WHERE status = 'pending') as pending_articles,
  (SELECT COUNT(*) FROM blog_articles WHERE status = 'draft') as draft_articles,
  (SELECT COUNT(*) FROM blog_comments WHERE status = 'approved') as approved_comments,
  (SELECT COUNT(*) FROM blog_comments WHERE status = 'pending') as pending_comments,
  (SELECT COUNT(*) FROM blog_categories) as categories_count,
  (SELECT COUNT(*) FROM blog_tags) as tags_count,
  (SELECT SUM(view_count) FROM blog_articles WHERE status = 'published') as total_views;

-- 3. Supprimer et recréer recettes_enrichies avec SECURITY INVOKER
DROP VIEW IF EXISTS recettes_enrichies;

CREATE VIEW recettes_enrichies 
WITH (security_invoker = true) AS
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

-- 4. Supprimer et recréer user_freemium_stats avec SECURITY INVOKER
DROP VIEW IF EXISTS user_freemium_stats;

CREATE VIEW user_freemium_stats 
WITH (security_invoker = true) AS
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
-- COMMENTAIRES ET VALIDATION
-- =====================================================

-- Commentaires pour la documentation
COMMENT ON VIEW blog_articles_with_metadata IS 'Vue sécurisée des articles avec métadonnées (SECURITY INVOKER)';
COMMENT ON VIEW blog_stats IS 'Vue sécurisée des statistiques blog (SECURITY INVOKER)';
COMMENT ON VIEW recettes_enrichies IS 'Vue sécurisée des recettes enrichies (SECURITY INVOKER)';
COMMENT ON VIEW user_freemium_stats IS 'Vue sécurisée des statistiques freemium utilisateur (SECURITY INVOKER)';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '=== CORRECTION VUES SECURITY DEFINER RÉUSSIE ===';
    RAISE NOTICE 'Vues converties en SECURITY INVOKER : 4';
    RAISE NOTICE '- blog_articles_with_metadata';
    RAISE NOTICE '- blog_stats'; 
    RAISE NOTICE '- recettes_enrichies';
    RAISE NOTICE '- user_freemium_stats';
    RAISE NOTICE 'Les vues respectent maintenant les politiques RLS';
    RAISE NOTICE '===============================================';
END $$;