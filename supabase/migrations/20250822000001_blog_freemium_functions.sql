-- Migration Blog TidiMondo - Fonctions freemium
-- Date: 2025-08-22
-- Description: Fonctions pour gérer les limitations freemium du blog

-- =====================================================
-- FONCTIONS DE COMPTAGE POUR LE BLOG
-- =====================================================

-- Fonction pour compter les articles d'un utilisateur ce mois-ci
CREATE OR REPLACE FUNCTION count_user_blog_articles_this_month(user_clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_uuid UUID;
  article_count INTEGER;
  start_of_month TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer l'UUID de l'utilisateur
  SELECT id INTO user_uuid
  FROM users
  WHERE clerk_user_id = user_clerk_id;
  
  IF user_uuid IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculer le début du mois actuel
  start_of_month := date_trunc('month', NOW());
  
  -- Compter les articles créés ce mois-ci
  SELECT COUNT(*)::INTEGER INTO article_count
  FROM blog_articles
  WHERE user_id = user_uuid
    AND created_at >= start_of_month;
  
  RETURN COALESCE(article_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les commentaires d'un utilisateur aujourd'hui
CREATE OR REPLACE FUNCTION count_user_blog_comments_today(user_clerk_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  user_uuid UUID;
  comment_count INTEGER;
  start_of_day TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer l'UUID de l'utilisateur
  SELECT id INTO user_uuid
  FROM users
  WHERE clerk_user_id = user_clerk_id;
  
  IF user_uuid IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Calculer le début de la journée actuelle
  start_of_day := date_trunc('day', NOW());
  
  -- Compter les commentaires créés aujourd'hui
  SELECT COUNT(*)::INTEGER INTO comment_count
  FROM blog_comments
  WHERE user_id = user_uuid
    AND created_at >= start_of_day;
  
  RETURN COALESCE(comment_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les statistiques blog d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_blog_stats(user_clerk_id TEXT)
RETURNS JSON AS $$
DECLARE
  user_uuid UUID;
  stats JSON;
BEGIN
  -- Récupérer l'UUID de l'utilisateur
  SELECT id INTO user_uuid
  FROM users
  WHERE clerk_user_id = user_clerk_id;
  
  IF user_uuid IS NULL THEN
    RETURN '{"error": "User not found"}'::JSON;
  END IF;
  
  -- Construire les statistiques
  SELECT json_build_object(
    'articles_count', (
      SELECT COUNT(*) FROM blog_articles WHERE user_id = user_uuid
    ),
    'published_articles_count', (
      SELECT COUNT(*) FROM blog_articles WHERE user_id = user_uuid AND status = 'published'
    ),
    'pending_articles_count', (
      SELECT COUNT(*) FROM blog_articles WHERE user_id = user_uuid AND status = 'pending'
    ),
    'draft_articles_count', (
      SELECT COUNT(*) FROM blog_articles WHERE user_id = user_uuid AND status = 'draft'
    ),
    'total_views', (
      SELECT COALESCE(SUM(view_count), 0) FROM blog_articles WHERE user_id = user_uuid AND status = 'published'
    ),
    'comments_received', (
      SELECT COUNT(*) 
      FROM blog_comments bc
      JOIN blog_articles ba ON bc.article_id = ba.id
      WHERE ba.user_id = user_uuid AND bc.status = 'approved'
    ),
    'articles_this_month', (
      SELECT COUNT(*) 
      FROM blog_articles 
      WHERE user_id = user_uuid 
        AND created_at >= date_trunc('month', NOW())
    ),
    'comments_today', (
      SELECT COUNT(*) 
      FROM blog_comments 
      WHERE user_id = user_uuid 
        AND created_at >= date_trunc('day', NOW())
    )
  ) INTO stats;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTIONS UTILITAIRES POUR LE BLOG
-- =====================================================

-- Fonction pour approuver automatiquement les commentaires des utilisateurs de confiance
CREATE OR REPLACE FUNCTION auto_approve_trusted_user_comments()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'utilisateur est admin, approuver automatiquement
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE id = NEW.user_id AND is_admin = true
  ) THEN
    NEW.status := 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour l'approbation automatique des commentaires
CREATE TRIGGER auto_approve_comments_trigger
  BEFORE INSERT ON blog_comments
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_trusted_user_comments();

-- Fonction pour mettre à jour automatiquement published_at lors de la publication
CREATE OR REPLACE FUNCTION update_article_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le statut passe à 'published' et published_at est null
  IF NEW.status = 'published' AND OLD.status != 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := NOW();
  END IF;
  
  -- Si le statut n'est plus 'published', remettre published_at à null
  IF NEW.status != 'published' AND OLD.status = 'published' THEN
    NEW.published_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la mise à jour automatique de published_at
CREATE TRIGGER update_published_at_trigger
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_article_published_at();

-- =====================================================
-- PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Accorder les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION count_user_blog_articles_this_month(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION count_user_blog_comments_today(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_blog_stats(TEXT) TO authenticated;

-- =====================================================
-- INDEX SUPPLÉMENTAIRES POUR LES PERFORMANCES
-- =====================================================

-- Index pour les requêtes de comptage par mois (simplifié)
CREATE INDEX IF NOT EXISTS idx_blog_articles_user_created_month
ON blog_articles(user_id, created_at);

-- Index pour les requêtes de comptage par jour (simplifié)
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_created_day
ON blog_comments(user_id, created_at);

-- Index pour les statistiques de vues
CREATE INDEX IF NOT EXISTS idx_blog_articles_status_views 
ON blog_articles(status, view_count) WHERE status = 'published';

-- =====================================================
-- DONNÉES DE TEST (OPTIONNEL)
-- =====================================================

-- Insérer un article de test pour l'admin (si un admin existe)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Trouver le premier utilisateur admin
  SELECT id INTO admin_user_id
  FROM users
  WHERE is_admin = true
  LIMIT 1;
  
  -- Si un admin existe, créer un article de bienvenue
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO blog_articles (
      user_id,
      category_id,
      title,
      slug,
      excerpt,
      content,
      status,
      is_featured,
      published_at
    )
    SELECT 
      admin_user_id,
      bc.id,
      'Bienvenue sur le blog TidiMondo !',
      'bienvenue-blog-tidimondo',
      'Découvrez notre nouveau blog dédié à l''organisation de séjours et aux conseils de voyage.',
      '# Bienvenue sur le blog TidiMondo !

Nous sommes ravis de vous présenter notre nouveau blog dédié à l''organisation de séjours et aux conseils de voyage.

## Que trouverez-vous ici ?

- **Conseils d''organisation** : Comment planifier vos séjours de A à Z
- **Astuces pratiques** : Des tips pour optimiser vos voyages
- **Destinations** : Découverte de lieux exceptionnels
- **Témoignages** : Retours d''expérience de notre communauté

## Contribuez au blog

Les utilisateurs Premium peuvent également publier leurs propres articles après modération. Partagez vos expériences et conseils avec la communauté !

Bon voyage avec TidiMondo ! 🌍',
      'published',
      true,
      NOW()
    FROM blog_categories bc
    WHERE bc.slug = 'organisation-sejours'
    LIMIT 1
    ON CONFLICT (slug) DO NOTHING;
    
    -- Ajouter quelques tags à l'article
    INSERT INTO blog_article_tags (article_id, tag_id)
    SELECT 
      ba.id,
      bt.id
    FROM blog_articles ba
    CROSS JOIN blog_tags bt
    WHERE ba.slug = 'bienvenue-blog-tidimondo'
      AND bt.slug IN ('planification', 'groupe')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;