# Guide de Migration Supabase

## 🎯 Option 1 : Migration Rapide (Interface Web)

1. **Ouvrir** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Aller** dans SQL Editor
3. **Coller** le contenu de `supabase/migrations/20250121_initial_schema.sql`
4. **Exécuter** la migration

## 🛠️ Option 2 : CLI Supabase (Recommandé)

### Installation
```bash
npm install -g supabase
```

### Configuration initiale
```bash
# Se connecter
supabase login

# Initialiser le projet (si pas déjà fait)
supabase init

# Lier au projet distant
supabase link --project-ref lytrlaotgttqxlrskbiz
supabase link --project-ref zqsjynmzhgaqnmztrzgg (pour la dev)
```

### Appliquer les migrations
```bash
# Appliquer sur le projet distant
supabase db push

# OU démarrer en local et appliquer
supabase start
supabase db reset
```

## 🔄 Workflow de Développement

### Créer une nouvelle migration
```bash
supabase migration new nom_de_la_migration
```

### Appliquer les migrations
```bash
# En local
supabase db reset

# Sur le projet distant
supabase db push
```

### Synchroniser depuis le distant
```bash
supabase db pull
```

## 📝 Bonnes Pratiques

1. **Toujours** tester en local avant de pousser
2. **Nommer** les migrations avec des timestamps
3. **Documenter** les changements importants
4. **Sauvegarder** avant les migrations importantes

## 🚨 Migration Actuelle

Pour résoudre le problème immédiat :

1. **Exécuter** `supabase/migrations/20250121_initial_schema.sql`
2. **Vérifier** que la table `users` existe
3. **Tester** l'authentification

## 🔧 Configuration Clerk

Après la migration, configurer dans Clerk :
- **JWT Template** : `supabase`
- **Callback URL** : `http://localhost:3000/auth/callback`