-- Insérer des catégories de base (ignorer si elles existent déjà)
INSERT INTO blog_categories (id, name, slug, description, color, sort_order) VALUES
(gen_random_uuid(), 'Conseils voyage', 'conseils-voyage', 'Astuces et conseils pour bien voyager', '#3B82F6', 1),
(gen_random_uuid(), 'Organisation séjours', 'organisation-sejours', 'Guides pour organiser des séjours parfaits', '#10B981', 2),
(gen_random_uuid(), 'Astuces pratiques', 'astuces-pratiques', 'Conseils pratiques du quotidien', '#F59E0B', 3)
ON CONFLICT (name) DO NOTHING;

-- Insérer des tags de base (ignorer si ils existent déjà)
INSERT INTO blog_tags (id, name, slug, color) VALUES
(gen_random_uuid(), 'Voyage', 'voyage', '#3B82F6'),
(gen_random_uuid(), 'Conseils', 'conseils', '#10B981'),
(gen_random_uuid(), 'Organisation', 'organisation', '#F59E0B'),
(gen_random_uuid(), 'Pratique', 'pratique', '#EF4444'),
(gen_random_uuid(), 'Guide', 'guide', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;