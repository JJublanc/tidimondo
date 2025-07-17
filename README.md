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
1. Dans le dashboard Stripe, allez dans "Developers" > "Webhooks"
2. Ajoutez un endpoint : `https://votre-domaine.com/api/webhooks/stripe`
3. Sélectionnez les événements :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🏗️ Structure du projet

Consultez [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) pour une explication détaillée de l'organisation du code.

## 🧪 Test de l'application

### Test sans configuration complète
Vous pouvez tester l'interface même sans configurer tous les services :

1. Commentez temporairement le ClerkProvider dans `src/app/layout.tsx`
2. Lancez `npm run dev`
3. Visitez [http://localhost:3000](http://localhost:3000)

### Test avec configuration complète
1. Configurez toutes les variables d'environnement
2. Créez le schéma de base de données
3. Configurez les webhooks
4. Testez le flux complet : inscription → dashboard → abonnement

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

## 📝 Prochaines étapes

1. ✅ Configuration de base terminée
2. 🚧 Configurer les services externes
3. 🚧 Créer les pages protégées (dashboard, settings)
4. 🚧 Implémenter la page de tarification
5. 🚧 Ajouter les webhooks
6. 🚧 Tests d'intégration

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
