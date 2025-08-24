# Guide de Déploiement du Blog TidiMondo

## 🚀 Étapes de Déploiement

### 1. Application des Migrations Supabase

#### Option A: Via le Dashboard Supabase (Recommandé)
1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet TidiMondo
3. Allez dans **SQL Editor**
4. Exécutez les migrations dans l'ordre suivant :

**Étape 1 - Système d'administration :**
```sql
-- Copier et exécuter le contenu de: supabase/migrations/20250821000000_add_admin_role.sql
```

**Étape 2 - Vérification :**
```sql
-- Vérifier que le champ is_admin existe
SELECT email, is_admin FROM users WHERE email = 'jjublanc@gmail.com';
```

**Étape 3 - Schema du blog :**
```sql
-- Copier et exécuter le contenu de: supabase/migrations/20250822000000_create_blog_schema.sql
```

**Étape 4 - Fonctions freemium :**
```sql
-- Copier et exécuter le contenu de: supabase/migrations/20250822000001_blog_freemium_functions.sql
```

#### Option B: Via CLI Supabase
```bash
# Si vous préférez utiliser la CLI
supabase db push
```

### 2. Configuration des Variables d'Environnement

Vérifiez que votre fichier `.env.local` contient :
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
```

### 3. Test Local

```bash
# Installer les dépendances si nécessaire
npm install

# Démarrer le serveur de développement
npm run dev
```

### 4. Vérification des Fonctionnalités

#### ✅ Pages Publiques
- [ ] `/blog` - Liste des articles publics
- [ ] `/blog/[slug]` - Page détail d'un article
- [ ] Navigation depuis la page d'accueil

#### ✅ Interface Utilisateur Premium
- [ ] `/blog` (connecté) - Interface de gestion des articles
- [ ] `/blog/nouveau` - Création d'article (premium uniquement)
- [ ] Restrictions freemium appliquées

#### ✅ Interface Administration
- [ ] `/admin` - Dashboard administrateur
- [ ] `/admin/users` - Gestion des utilisateurs
- [ ] `/admin/blog` - Gestion des articles
- [ ] Vérification des permissions admin

### 5. Configuration des Permissions Admin

Une fois les migrations appliquées, votre email (`jjublanc@gmail.com`) devrait automatiquement avoir les droits administrateur. Pour vérifier :

```sql
-- Dans le SQL Editor de Supabase
SELECT email, is_admin FROM users WHERE email = 'jjublanc@gmail.com';
```

Si le résultat montre `is_admin: true`, vous êtes prêt !

### 6. Données de Test

Le système inclut des données de test automatiques :
- 3 catégories : "Conseils de voyage", "Destinations", "Gastronomie"
- 5 articles d'exemple
- Tags associés

## 🔧 Dépannage

### Problème : Migration échoue
**Solution :** Vérifiez l'ordre des migrations. Le champ `is_admin` doit exister avant la création du schema blog.

### Problème : Pas d'accès admin
**Solution :** Exécutez manuellement :
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'jjublanc@gmail.com';
```

### Problème : Erreurs TypeScript
**Solution :** Redémarrez le serveur de développement :
```bash
npm run dev
```

### Problème : RLS (Row Level Security)
Les politiques RLS sont configurées automatiquement pour :
- Articles publics visibles par tous
- Articles en brouillon visibles par l'auteur uniquement
- Gestion admin complète pour les administrateurs

## 📝 Prochaines Étapes

Après le déploiement réussi :

1. **Système de modération** - Interface pour approuver/rejeter les articles
2. **Commentaires** - Système de commentaires avec modération
3. **SEO** - Métadonnées et optimisation pour les moteurs de recherche
4. **Analytics** - Suivi des vues et engagement
5. **Newsletter** - Intégration d'une newsletter pour les nouveaux articles

## 🎯 Points Clés

- ✅ **Sécurité** : Système d'admin basé sur la base de données
- ✅ **Freemium** : Restrictions automatiques pour les utilisateurs gratuits
- ✅ **Performance** : Requêtes optimisées avec index
- ✅ **UX** : Interface intuitive pour tous les types d'utilisateurs
- ✅ **Évolutivité** : Architecture modulaire pour futures extensions

Le blog est maintenant prêt à être utilisé en production !