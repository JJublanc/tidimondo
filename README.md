# TidiMondo SaaS Platform

Une plateforme SaaS moderne construite avec Next.js 14, intégrant l'authentification Clerk, les paiements Stripe, et une base de données Supabase.

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Comptes sur Clerk, Supabase et Stripe

### Installation

1. **Cloner et installer les dépendances**
```bash
git clone <votre-repo>
cd tidimondo
npm install
```

2. **Configurer les variables d'environnement**

Copiez le fichier `.env.local` et remplacez les valeurs par vos vraies clés API :

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBHOOK_SECRET=your_webhook_secret_here
```

3. **Lancer l'application**
```bash
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

## 📋 Configuration des services

### 1. Clerk (Authentification)

1. Créez un compte sur [Clerk.com](https://clerk.com)
2. Créez une nouvelle application
3. Dans le dashboard Clerk :
   - Allez dans "API Keys"
   - Copiez la "Publishable key" et la "Secret key"
   - Configurez les URLs de redirection :
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in: `/dashboard`
     - After sign-up: `/dashboard`

#### Configuration JWT Template (Important)
Pour l'intégration avec Supabase, configurez un JWT Template dans Clerk :

1. Dans le dashboard Clerk, allez dans "JWT Templates"
2. Créez un nouveau template nommé "supabase"
3. Configurez les claims :
```json
{
 "aud": "authenticated",
 "exp": {{exp}},
 "iat": {{iat}},
 "iss": "{{iss}}",
 "sub": "{{user.id}}",
 "email": "{{user.primary_email_address.email_address}}",
 "role": "authenticated"
}
```

### 2. Supabase (Base de données)

1. Créez un compte sur [Supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Dans le dashboard Supabase :
   - Allez dans "Settings" > "API"
   - Copiez l'URL du projet et les clés API
   - Créez les tables nécessaires (voir section Schéma)

### 3. Stripe (Paiements)

1. Créez un compte sur [Stripe.com](https://stripe.com)
2. Dans le dashboard Stripe :
   - Allez dans "Developers" > "API keys"
   - Copiez les clés de test
   - Créez un produit et un prix
   - Copiez l'ID du prix (price_...)
   - Configurez les webhooks (voir section Webhooks)

## 🗄️ Schéma de base de données

### Configuration automatique (Recommandée)

Utilisez les migrations Supabase pour configurer automatiquement la base de données :

```bash
# Appliquer toutes les migrations
npx supabase db push
```

Les migrations incluent :
- **Table users** avec politiques RLS hybrides
- **Fonction create_user_profile** pour création automatique
- **Politiques de sécurité** optimisées
- **Index** pour les performances

### Configuration manuelle (Alternative)

Si vous préférez configurer manuellement, exécutez ces requêtes SQL dans l'éditeur Supabase :

```sql
-- Table des utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  subscription_id TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS hybrides
CREATE POLICY "Allow authenticated user creation" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' IS NOT NULL);

CREATE POLICY "Block client reads" ON users
  FOR SELECT USING (false);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    auth.jwt() ->> 'sub' IS NOT NULL AND
    clerk_user_id = auth.jwt() ->> 'sub'
  );

-- Fonction de création automatique d'utilisateurs
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_clerk_user_id text,
  p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_user public.users%ROWTYPE;
  jwt_sub text;
BEGIN
  jwt_sub := auth.jwt() ->> 'sub';
  
  IF jwt_sub IS NULL OR jwt_sub != p_clerk_user_id THEN
    RAISE EXCEPTION 'Unauthorized: JWT mismatch';
  END IF;

  INSERT INTO public.users (clerk_user_id, email, subscription_status)
  VALUES (p_clerk_user_id, p_email, 'free')
  ON CONFLICT (clerk_user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now()
  RETURNING * INTO result_user;

  RETURN json_build_object(
    'id', result_user.id,
    'clerk_user_id', result_user.clerk_user_id,
    'subscription_status', result_user.subscription_status,
    'created_at', result_user.created_at
  );
END;
$$;

-- Permissions pour la fonction
GRANT EXECUTE ON FUNCTION public.create_user_profile(text, text) TO authenticated;

-- Index pour les performances
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
```

### 🔐 Stratégie RLS Hybride

Notre solution utilise une **stratégie RLS hybride** qui :

- ✅ **Bloque la lecture** directe de la table `users` côté client (sécurité)
- ✅ **Permet la création** automatique via une fonction SQL sécurisée
- ✅ **Gère l'idempotence** avec `ON CONFLICT DO UPDATE`
- ✅ **Valide les JWT** côté serveur dans la fonction

📖 **Documentation complète** : [CLERK_SUPABASE_JWT_INTEGRATION.md](./CLERK_SUPABASE_JWT_INTEGRATION.md)

## 🔗 Configuration des webhooks

### Webhooks Clerk
1. Dans le dashboard Clerk, allez dans "Webhooks"
2. Ajoutez un endpoint : `https://votre-domaine.com/api/webhooks/clerk`
3. Sélectionnez les événements : `user.created`, `user.updated`, `user.deleted`

### Webhooks Stripe

#### 🚀 Développement (Recommandé : Stripe CLI)
```bash
# Installation
brew install stripe/stripe-cli/stripe

# Connexion
stripe login

# Écoute des webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Avantages** : Pas de configuration manuelle, logs détaillés, tests intégrés

#### 🌐 Production (Dashboard Stripe)
1. Dans le dashboard Stripe, allez dans "Developers" > "Webhooks"
2. Ajoutez un endpoint : `https://votre-domaine.com/api/webhooks/stripe`
3. Sélectionnez les événements :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

📖 **Documentation complète** : Voir [00-STRIPE_DOCUMENTATION_INDEX.md](./00-STRIPE_DOCUMENTATION_INDEX.md)

## 🏗️ Structure du projet

Consultez [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) pour une explication détaillée de l'organisation du code.

## 🧪 Test de l'application

### Test rapide de l'interface
Vous pouvez tester l'interface même sans configurer tous les services :

1. Commentez temporairement le ClerkProvider dans `src/app/layout.tsx`
2. Lancez `npm run dev`
3. Visitez [http://localhost:3000](http://localhost:3000)

### Test complet avec Stripe CLI (Recommandé)
```bash
# Terminal 1 : Application
npm run dev

# Terminal 2 : Webhooks Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 : Tests d'événements
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

### Test avec configuration complète
1. Configurez toutes les variables d'environnement
2. Créez le schéma de base de données
3. Configurez les webhooks (Stripe CLI ou manuel)
4. Testez le flux complet : inscription → dashboard → abonnement

📖 **Guides de test détaillés** :
- [03-STRIPE_CLI_SETUP.md](./03-STRIPE_CLI_SETUP.md) - Installation Stripe CLI
- [04-STRIPE_WEBHOOK_TESTING.md](./04-STRIPE_WEBHOOK_TESTING.md) - Tests complets

## 📦 Scripts disponibles

```bash
npm run dev          # Lancer en mode développement
npm run build        # Construire pour la production
npm run start        # Lancer en mode production
npm run lint         # Vérifier le code avec ESLint
```

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connectez votre repo GitHub à Vercel
2. Configurez les variables d'environnement dans Vercel
3. Mettez à jour les URLs dans Clerk et Stripe
4. Déployez !

## 🛠️ Technologies utilisées

- **Frontend** : Next.js 14, React, TypeScript
- **Styling** : Tailwind CSS, Radix UI
- **Authentification** : Clerk
- **Base de données** : Supabase (PostgreSQL)
- **Paiements** : Stripe
- **Déploiement** : Vercel

## 📝 État du projet

1. ✅ Configuration Next.js 14 + TypeScript + Tailwind
2. ✅ Authentification Clerk complète avec JWT Templates
3. ✅ Base de données Supabase avec stratégie RLS hybride
4. ✅ Intégration Clerk-Supabase avec création automatique d'utilisateurs
5. ✅ Intégration Stripe (paiements + webhooks)
6. ✅ Pages protégées (dashboard, settings)
7. ✅ Page de tarification fonctionnelle
8. ✅ Webhooks Clerk et Stripe implémentés
9. ✅ Politiques RLS sécurisées (lecture bloquée côté client)
10. ✅ Fonction SQL pour création automatique d'utilisateurs
11. ✅ Tests d'intégration documentés
12. ✅ Documentation complète de l'architecture
13. 🚧 Variables d'environnement pour la production
14. 🚧 Déploiement sur Vercel

### 🎯 Fonctionnalités clés

- **Authentification sécurisée** : Intégration Clerk-Supabase avec JWT
- **Création automatique d'utilisateurs** : Pas besoin de webhooks complexes
- **Sécurité RLS** : Lecture bloquée côté client, écriture contrôlée
- **Paiements Stripe** : Abonnements et webhooks fonctionnels
- **Architecture moderne** : Next.js 14, TypeScript, Tailwind CSS

## 📚 Documentation

### Documentation Stripe
- **[00-STRIPE_DOCUMENTATION_INDEX.md](./00-STRIPE_DOCUMENTATION_INDEX.md)** - Index complet de la documentation Stripe
- **[01-STRIPE_INTEGRATION_GUIDE.md](./01-STRIPE_INTEGRATION_GUIDE.md)** - Guide d'intégration complet
- **[02-STRIPE_PRICE_ID_SETUP.md](./02-STRIPE_PRICE_ID_SETUP.md)** - Configuration du Price ID
- **[03-STRIPE_CLI_SETUP.md](./03-STRIPE_CLI_SETUP.md)** - Installation et configuration Stripe CLI
- **[04-STRIPE_WEBHOOK_TESTING.md](./04-STRIPE_WEBHOOK_TESTING.md)** - Tests complets des webhooks
- **[05-STRIPE_TROUBLESHOOTING.md](./05-STRIPE_TROUBLESHOOTING.md)** - Résolution des problèmes

### Documentation Authentification
- **[CLERK_SUPABASE_JWT_INTEGRATION.md](./CLERK_SUPABASE_JWT_INTEGRATION.md)** - Intégration Clerk-Supabase avec stratégie RLS hybride
- **[SUPABASE_THIRD_PARTY_AUTH_CONFIG.md](./SUPABASE_THIRD_PARTY_AUTH_CONFIG.md)** - Configuration Third-Party Auth
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guide de migration

### Documentation Générale
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Structure détaillée du projet
- **[ROUTE_PROTECTION_EXPLAINED.md](./ROUTE_PROTECTION_EXPLAINED.md)** - Protection des routes
- **[WEBHOOKS_EXPLAINED.md](./WEBHOOKS_EXPLAINED.md)** - Fonctionnement des webhooks
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Guide de tests complets

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
