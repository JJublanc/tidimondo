-- Migration Blog TidiMondo - Création du schéma complet
-- Date: 2025-08-22
-- Description: Création de toutes les tables pour le système de blog

-- =====================================================
-- 1. TABLE DES CATÉGORIES
-- =====================================================

CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6B7280', -- Couleur hex pour l'affichage
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_sort_order ON blog_categories(sort_order);

-- =====================================================
-- 2. TABLE DES TAGS
-- =====================================================

CREATE TABLE blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX idx_blog_tags_name ON blog_tags(name);

-- =====================================================
-- 3. TABLE DES ARTICLES
-- =====================================================

CREATE TABLE blog_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT, -- Résumé de l'article
  content TEXT NOT NULL, -- Contenu Markdown
  featured_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX idx_blog_articles_status ON blog_articles(status);
CREATE INDEX idx_blog_articles_user_id ON blog_articles(user_id);
CREATE INDEX idx_blog_articles_category_id ON blog_articles(category_id);
CREATE INDEX idx_blog_articles_published_at ON blog_articles(published_at DESC);
CREATE INDEX idx_blog_articles_is_featured ON blog_articles(is_featured) WHERE is_featured = true;

-- =====================================================
-- 4. TABLE DE LIAISON ARTICLES-TAGS
-- =====================================================

CREATE TABLE blog_article_tags (
  article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_blog_article_tags_article_id ON blog_article_tags(article_id);
CREATE INDEX idx_blog_article_tags_tag_id ON blog_article_tags(tag_id);

-- =====================================================
-- 5. TABLE DES COMMENTAIRES
-- =====================================================

CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES blog_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES blog_comments(id) ON DELETE CASCADE, -- Pour les réponses
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_blog_comments_article_id ON blog_comments(article_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX idx_blog_comments_status ON blog_comments(status);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at DESC);

-- =====================================================
-- 6. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour générer un slug unique
CREATE OR REPLACE FUNCTION generate_blog_slug(title TEXT, table_name TEXT DEFAULT 'blog_articles')
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Normaliser le titre en slug
  base_slug := lower(trim(regexp_replace(
    unaccent(title), 
    '[^a-zA-Z0-9\s-]', '', 'g'
  )));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(base_slug, '-');
  
  final_slug := base_slug;
  
  -- Vérifier l'unicité et ajouter un suffixe si nécessaire
  WHILE EXISTS (
    SELECT 1 FROM blog_articles WHERE slug = final_slug
  ) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON blog_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_articles_updated_at
  BEFORE UPDATE ON blog_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_comments_updated_at
  BEFORE UPDATE ON blog_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Policies pour blog_categories (lecture publique, écriture admin)
CREATE POLICY "Catégories visibles par tous" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Catégories modifiables par admin" ON blog_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policies pour blog_tags (lecture publique, écriture admin)
CREATE POLICY "Tags visibles par tous" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Tags modifiables par admin" ON blog_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policies pour blog_articles
CREATE POLICY "Articles publiés visibles par tous" ON blog_articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Auteurs voient leurs propres articles" ON blog_articles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins voient tous les articles" ON blog_articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Utilisateurs premium peuvent créer des articles" ON blog_articles
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (users.subscription_status = 'active' OR users.is_admin = true)
      )
    )
  );

CREATE POLICY "Auteurs peuvent modifier leurs articles" ON blog_articles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins peuvent modifier tous les articles" ON blog_articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- Policies pour blog_article_tags (suivent les articles)
CREATE POLICY "Tags d'articles visibles selon article" ON blog_article_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM blog_articles 
      WHERE blog_articles.id = article_id 
      AND (
        blog_articles.status = 'published' 
        OR blog_articles.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.is_admin = true
        )
      )
    )
  );

CREATE POLICY "Gestion tags par auteur ou admin" ON blog_article_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM blog_articles 
      WHERE blog_articles.id = article_id 
      AND (
        blog_articles.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM users 
          WHERE users.id = auth.uid() 
          AND users.is_admin = true
        )
      )
    )
  );

-- Policies pour blog_comments
CREATE POLICY "Commentaires approuvés visibles par tous" ON blog_comments
  FOR SELECT USING (
    status = 'approved' AND
    EXISTS (
      SELECT 1 FROM blog_articles 
      WHERE blog_articles.id = article_id 
      AND blog_articles.status = 'published'
    )
  );

CREATE POLICY "Auteurs voient leurs commentaires" ON blog_comments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins voient tous les commentaires" ON blog_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

CREATE POLICY "Utilisateurs connectés peuvent commenter" ON blog_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM blog_articles 
      WHERE blog_articles.id = article_id 
      AND blog_articles.status = 'published'
    )
  );

CREATE POLICY "Auteurs peuvent modifier leurs commentaires" ON blog_comments
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins peuvent modérer tous les commentaires" ON blog_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = true
    )
  );

-- =====================================================
-- 8. DONNÉES INITIALES
-- =====================================================

-- Catégories par défaut
INSERT INTO blog_categories (name, slug, description, color, sort_order) VALUES
  ('Conseils voyage', 'conseils-voyage', 'Astuces et conseils pour bien voyager', '#3B82F6', 1),
  ('Organisation séjours', 'organisation-sejours', 'Guides pour organiser des séjours parfaits', '#10B981', 2),
  ('Astuces pratiques', 'astuces-pratiques', 'Conseils pratiques du quotidien', '#F59E0B', 3),
  ('Destinations', 'destinations', 'Découverte de destinations exceptionnelles', '#EF4444', 4),
  ('Témoignages', 'témoignages', 'Retours d''expérience de nos utilisateurs', '#8B5CF6', 5);

-- Tags par défaut
INSERT INTO blog_tags (name, slug, color) VALUES
  ('Budget', 'budget', '#10B981'),
  ('Famille', 'famille', '#F59E0B'),
  ('Groupe', 'groupe', '#3B82F6'),
  ('Solo', 'solo', '#EF4444'),
  ('Weekend', 'weekend', '#8B5CF6'),
  ('Longue durée', 'longue-duree', '#6B7280'),
  ('Europe', 'europe', '#059669'),
  ('Planification', 'planification', '#DC2626'),
  ('Transport', 'transport', '#7C3AED'),
  ('Hébergement', 'hebergement', '#DB2777');

-- =====================================================
-- 9. VUES UTILITAIRES
-- =====================================================

-- Vue pour les articles avec leurs métadonnées
CREATE VIEW blog_articles_with_metadata AS
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

-- Vue pour les statistiques du blog
CREATE VIEW blog_stats AS
SELECT 
  (SELECT COUNT(*) FROM blog_articles WHERE status = 'published') as published_articles,
  (SELECT COUNT(*) FROM blog_articles WHERE status = 'pending') as pending_articles,
  (SELECT COUNT(*) FROM blog_articles WHERE status = 'draft') as draft_articles,
  (SELECT COUNT(*) FROM blog_comments WHERE status = 'approved') as approved_comments,
  (SELECT COUNT(*) FROM blog_comments WHERE status = 'pending') as pending_comments,
  (SELECT COUNT(*) FROM blog_categories) as categories_count,
  (SELECT COUNT(*) FROM blog_tags) as tags_count,
  (SELECT SUM(view_count) FROM blog_articles WHERE status = 'published') as total_views;