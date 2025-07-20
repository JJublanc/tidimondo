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

Exécutez ces requêtes SQL dans l'éditeur Supabase :

```sql
-- Table des utilisateurs
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_id TEXT,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des abonnements
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

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
2. ✅ Authentification Clerk complète
3. ✅ Base de données Supabase configurée
4. ✅ Intégration Stripe (paiements + webhooks)
5. ✅ Pages protégées (dashboard, settings)
6. ✅ Page de tarification fonctionnelle
7. ✅ Webhooks Clerk et Stripe implémentés
8. ✅ Tests d'intégration documentés
9. 🚧 Variables d'environnement pour la production
10. 🚧 Déploiement sur Vercel

## 📚 Documentation

### Documentation Stripe
- **[00-STRIPE_DOCUMENTATION_INDEX.md](./00-STRIPE_DOCUMENTATION_INDEX.md)** - Index complet de la documentation Stripe
- **[01-STRIPE_INTEGRATION_GUIDE.md](./01-STRIPE_INTEGRATION_GUIDE.md)** - Guide d'intégration complet
- **[02-STRIPE_PRICE_ID_SETUP.md](./02-STRIPE_PRICE_ID_SETUP.md)** - Configuration du Price ID
- **[03-STRIPE_CLI_SETUP.md](./03-STRIPE_CLI_SETUP.md)** - Installation et configuration Stripe CLI
- **[04-STRIPE_WEBHOOK_TESTING.md](./04-STRIPE_WEBHOOK_TESTING.md)** - Tests complets des webhooks
- **[05-STRIPE_TROUBLESHOOTING.md](./05-STRIPE_TROUBLESHOOTING.md)** - Résolution des problèmes

### Documentation Générale
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Structure détaillée du projet
- **[ROUTE_PROTECTION_EXPLAINED.md](./ROUTE_PROTECTION_EXPLAINED.md)** - Protection des routes
- **[WEBHOOKS_EXPLAINED.md](./WEBHOOKS_EXPLAINED.md)** - Fonctionnement des webhooks

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
