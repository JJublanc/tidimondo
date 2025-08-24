-- Script pour créer des articles de test pour la modération
-- À exécuter dans le SQL Editor de Supabase

-- Vérifier d'abord que l'utilisateur admin existe
SELECT id, email, is_admin FROM users WHERE email = 'jjublanc@gmail.com';

-- Insérer quelques articles de test avec différents statuts
INSERT INTO blog_articles (
  id,
  user_id,
  title,
  slug,
  excerpt,
  content,
  category_id,
  status,
  is_featured,
  view_count,
  created_at,
  updated_at
) VALUES 
-- Article en attente de modération
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'jjublanc@gmail.com' LIMIT 1),
  'Guide complet pour organiser un week-end gastronomique',
  'guide-weekend-gastronomique',
  'Découvrez comment planifier un week-end culinaire mémorable avec nos conseils d''experts.',
  '# Guide complet pour organiser un week-end gastronomique

Un week-end gastronomique bien organisé peut devenir une expérience inoubliable. Voici notre guide complet.

## Préparation en amont

La clé du succès réside dans la préparation. Commencez par définir votre budget et vos objectifs.

### Choix de la destination
- Recherchez les spécialités locales
- Consultez les guides gastronomiques
- Vérifiez les horaires d''ouverture

### Réservations
Réservez vos restaurants au moins 2 semaines à l''avance pour les établissements réputés.

## Programme type

### Jour 1 : Arrivée et découverte
- 12h : Arrivée et déjeuner léger
- 15h : Visite du marché local
- 19h : Dîner dans un restaurant traditionnel

### Jour 2 : Immersion culinaire
- 9h : Petit-déjeuner local
- 10h : Cours de cuisine avec un chef
- 13h : Déjeuner avec les plats préparés
- 16h : Dégustation chez un producteur
- 20h : Dîner gastronomique

## Conseils pratiques

- Prévoyez des vêtements confortables
- Gardez de la place pour goûter
- Prenez des photos pour immortaliser
- Notez vos découvertes

Un week-end gastronomique réussi allie plaisir et découverte !',
  (SELECT id FROM blog_categories WHERE slug = 'conseils-voyage' LIMIT 1),
  'pending',
  false,
  0,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
),
-- Article brouillon
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'jjublanc@gmail.com' LIMIT 1),
  'Les erreurs à éviter lors de la planification de repas',
  'erreurs-planification-repas',
  'Évitez ces pièges courants pour une planification de repas réussie.',
  '# Les erreurs à éviter lors de la planification de repas

La planification de repas peut transformer votre quotidien, mais certaines erreurs peuvent tout gâcher.

## Erreur #1 : Planifier trop de nouveaux plats

Il est tentant de vouloir essayer plein de nouvelles recettes, mais cela peut être stressant.

**Solution :** Alternez entre plats familiers et nouvelles découvertes.

## Erreur #2 : Oublier les contraintes de temps

Prévoir des plats compliqués en semaine est une recette pour l''échec.

**Solution :** Gardez les recettes élaborées pour le week-end.

## Erreur #3 : Ne pas tenir compte des restes

Ignorer les restes conduit au gaspillage alimentaire.

**Solution :** Planifiez des repas qui utilisent les restes du jour précédent.',
  (SELECT id FROM blog_categories WHERE slug = 'conseils-voyage' LIMIT 1),
  'draft',
  false,
  0,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
-- Article en attente de modération (deuxième exemple)
(
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'jjublanc@gmail.com' LIMIT 1),
  'Comment choisir les meilleurs restaurants pendant vos voyages',
  'choisir-restaurants-voyage',
  'Nos astuces pour dénicher les meilleures adresses culinaires en voyage.',
  '# Comment choisir les meilleurs restaurants pendant vos voyages

Bien manger en voyage est un art qui s''apprend. Voici nos conseils d''experts.

## Recherche préalable

Avant même de partir, commencez vos recherches :

### Applications utiles
- **TripAdvisor** : avis de voyageurs
- **Foursquare** : recommandations locales  
- **Google Maps** : horaires et photos

### Sources fiables
- Guides gastronomiques locaux
- Blogs de food bloggers de la région
- Recommandations d''habitants

## Sur place

### Observez les habitudes locales
- Où mangent les habitants ?
- Quels sont les horaires de pointe ?
- Quels plats sont populaires ?

### Signes de qualité
- Restaurant plein d''habitants
- Menu court mais bien exécuté
- Ingrédients frais et de saison
- Personnel passionné

## Pièges à éviter

- Restaurants dans les zones très touristiques
- Menus traduits en 10 langues
- Photos plastifiées des plats
- Rabatteurs devant l''établissement

## Conseils pratiques

1. **Réservez** : surtout pour les adresses réputées
2. **Soyez flexible** : certains plats ne sont disponibles que certains jours
3. **Goûtez local** : c''est l''occasion de découvrir de nouveaux goûts
4. **Respectez les codes** : chaque culture a ses habitudes

Bon appétit et bon voyage !',
  (SELECT id FROM blog_categories WHERE slug = 'destinations' LIMIT 1),
  'pending',
  false,
  0,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
);

-- Vérifier que les articles ont été créés
SELECT 
  id,
  title,
  status,
  created_at
FROM blog_articles 
ORDER BY created_at DESC 
LIMIT 5;