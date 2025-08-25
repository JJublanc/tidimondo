# Guide d'exécution des migrations TidiMondo

## Vue d'ensemble

Ce guide détaille comment exécuter les migrations Supabase pour implémenter le schéma complet de TidiMondo.

## Fichiers de migration créés

1. **`20250213000000_create_tidimondo_schema.sql`** - Création du schéma principal
2. **`20250213000001_setup_rls_and_data.sql`** - Configuration RLS et données de base
3. **`20250213000002_test_data.sql`** - Données de test et validation

## Prérequis

- Supabase CLI installé et configuré
- Accès à votre projet Supabase
- Base de données avec les tables `users` et `subscriptions` existantes

## Étapes d'exécution

### 1. Vérification de l'environnement

```bash
# Vérifier la connexion à Supabase
supabase status

# Vérifier les migrations existantes
supabase db diff
```

### 2. Exécution des migrations

#### Option A : Via Supabase CLI (Recommandé)

```bash
# Se placer dans le répertoire du projet
cd /Users/jjublanc/projets_perso/tidimondo

# Appliquer toutes les nouvelles migrations
supabase db push

# Ou appliquer une migration spécifique
supabase db push --include-all
```

#### Option B : Via l'interface Supabase

1. Aller dans l'onglet "SQL Editor" de votre projet Supabase
2. Exécuter les fichiers dans l'ordre :
   - `20250213000000_create_tidimondo_schema.sql`
   - `20250213000001_setup_rls_and_data.sql`
   - `20250213000002_test_data.sql` (optionnel, pour les tests)

### 3. Validation de l'installation

#### Vérifier les tables créées

```sql
-- Lister toutes les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Vérifier les données de base
SELECT COUNT(*) as nb_ingredients FROM ingredients;
SELECT COUNT(*) as nb_ustensiles FROM ustensiles;
```

#### Tester les fonctions

```sql
-- Tester la fonction de normalisation
SELECT normaliser_nom('Crème fraîche à l''ail');

-- Tester les fonctions de limitation freemium
SELECT can_create_sejour('test_user_tidimondo');
```

#### Vérifier les politiques RLS

```sql
-- Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('recettes', 'sejours', 'ingredients');
```

## Résolution des problèmes courants

### Erreur : Extension unaccent non disponible

```sql
-- Activer l'extension manuellement
CREATE EXTENSION IF NOT EXISTS unaccent;
```

### Erreur : Utilisateur de test déjà existant

```sql
-- Supprimer les données de test si nécessaire
DELETE FROM users WHERE clerk_user_id = 'test_user_tidimondo';
```

### Erreur : Contraintes de clés étrangères

Vérifier que les tables `users` et `subscriptions` existent et ont la bonne structure :

```sql
-- Vérifier la structure de la table users
\d users;

-- Vérifier les données existantes
SELECT id, clerk_user_id, email FROM users LIMIT 5;
```

## Validation post-migration

### 1. Tests automatiques

Les tests sont intégrés dans la migration `20250213000002_test_data.sql`. Vérifier les messages dans les logs :

- ✅ Test contrainte de date: OK
- ✅ Test contrainte de quantité: OK
- ✅ Fonctions utilitaires fonctionnelles
- ✅ Vues créées avec succès
- ✅ Normalisation automatique active

### 2. Tests manuels

#### Créer une recette de test

```sql
-- Insérer via un utilisateur existant
INSERT INTO recettes (user_id, nom, instructions, portions)
SELECT id, 'Test Recette', 'Instructions de test', 4
FROM users 
WHERE clerk_user_id = 'votre_clerk_user_id'
LIMIT 1;
```

#### Créer un séjour de test

```sql
-- Insérer un séjour
INSERT INTO sejours (user_id, nom, date_debut, date_fin, nombre_participants)
SELECT id, 'Test Séjour', CURRENT_DATE + 7, CURRENT_DATE + 9, 2
FROM users 
WHERE clerk_user_id = 'votre_clerk_user_id'
LIMIT 1;
```

### 3. Vérification des performances

```sql
-- Tester les index
EXPLAIN ANALYZE SELECT * FROM recettes WHERE nom_normalise LIKE 'crepe%';
EXPLAIN ANALYZE SELECT * FROM sejours WHERE user_id = 'uuid_utilisateur';
```

## Nettoyage (optionnel)

Pour supprimer les données de test en production :

```sql
-- Supprimer l'utilisateur de test et toutes ses données
DELETE FROM users WHERE clerk_user_id = 'test_user_tidimondo';

-- Supprimer les ingrédients de test spécifiques si nécessaire
DELETE FROM ingredients WHERE nom = 'Crème fraîche épaisse';
```

## Rollback (en cas de problème)

### Rollback complet

```bash
# Via Supabase CLI
supabase db reset

# Puis réappliquer les migrations existantes seulement
```

### Rollback partiel

```sql
-- Supprimer les nouvelles tables dans l'ordre inverse
DROP TABLE IF EXISTS listes_courses CASCADE;
DROP TABLE IF EXISTS sejour_repas CASCADE;
DROP TABLE IF EXISTS sejour_participants CASCADE;
DROP TABLE IF EXISTS sejours CASCADE;
DROP TABLE IF EXISTS recette_ustensiles CASCADE;
DROP TABLE IF EXISTS recette_ingredients CASCADE;
DROP TABLE IF EXISTS recettes CASCADE;
DROP TABLE IF EXISTS ustensiles CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS can_create_sejour(TEXT);
DROP FUNCTION IF EXISTS count_user_sejours(TEXT);
DROP FUNCTION IF EXISTS normaliser_nom(TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS auto_normaliser_ingredient();
DROP FUNCTION IF EXISTS auto_normaliser_ustensile();
DROP FUNCTION IF EXISTS auto_normaliser_recette();
DROP FUNCTION IF EXISTS check_repas_dans_sejour();

-- Supprimer les vues
DROP VIEW IF EXISTS recettes_enrichies;
DROP VIEW IF EXISTS sejours_stats;
```

## Prochaines étapes

Une fois les migrations exécutées avec succès :

1. ✅ **Phase 1.2 terminée** - Base de données opérationnelle
2. ➡️ **Phase 1.3** - Mise à jour des types TypeScript
3. ➡️ **Phase 2.1** - Développement des interfaces

## Checklist de validation

- [ ] Toutes les migrations exécutées sans erreur
- [ ] Tables créées avec les bonnes contraintes
- [ ] Index créés et fonctionnels
- [ ] Politiques RLS activées et testées
- [ ] Données de base insérées (ingrédients, ustensiles)
- [ ] Fonctions utilitaires opérationnelles
- [ ] Tests automatiques passés
- [ ] Vues créées et fonctionnelles
- [ ] Performance acceptable sur les requêtes de base

## Support

En cas de problème :
1. Vérifier les logs Supabase
2. Consulter la documentation des contraintes dans `DATABASE_SCHEMA_DESIGN.md`
3. Tester les requêtes individuellement
4. Utiliser le rollback si nécessaire

---

**Note importante** : Ces migrations modifient la structure de la base de données. Il est recommandé de les tester d'abord sur un environnement de développement avant de les appliquer en production.