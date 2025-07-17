# Structure du Projet TidiMondo SaaS

## Vue d'ensemble
TidiMondo est une plateforme SaaS moderne construite avec Next.js 14, intégrant l'authentification Clerk, les paiements Stripe, et une base de données Supabase.

## Architecture des dossiers

```
tidimondo/
├── src/                          # Code source principal
│   ├── app/                      # App Router de Next.js 14
│   │   ├── (auth)/              # Groupe de routes d'authentification
│   │   │   ├── sign-in/         # Page de connexion
│   │   │   └── sign-up/         # Page d'inscription
│   │   ├── (protected)/         # Groupe de routes protégées
│   │   │   ├── dashboard/       # Dashboard utilisateur (à créer)
│   │   │   └── settings/        # Paramètres utilisateur (à créer)
│   │   ├── api/                 # Routes API
│   │   │   └── webhooks/        # Webhooks pour intégrations
│   │   │       ├── clerk/       # Webhooks Clerk (à créer)
│   │   │       └── stripe/      # Webhooks Stripe (à créer)
│   │   ├── pricing/             # Page de tarification (à créer)
│   │   ├── globals.css          # Styles globaux avec variables CSS
│   │   ├── layout.tsx           # Layout racine avec ClerkProvider
│   │   └── page.tsx             # Page d'accueil publique
│   ├── components/              # Composants réutilisables
│   │   ├── ui/                  # Composants UI de base
│   │   │   └── button.tsx       # Composant Button avec variants
│   │   ├── auth/                # Composants d'authentification (à créer)
│   │   └── layout/              # Composants de mise en page (à créer)
│   ├── lib/                     # Utilitaires et configurations
│   │   ├── utils.ts             # Fonctions utilitaires (cn pour classes)
│   │   ├── supabase.ts          # Configuration client Supabase
│   │   └── stripe.ts            # Configuration et fonctions Stripe
│   ├── types/                   # Types TypeScript
│   │   └── index.ts             # Types pour User, Subscription, etc.
│   └── middleware.ts            # Middleware Clerk pour protection des routes
├── public/                      # Fichiers statiques
├── .env.local                   # Variables d'environnement (à configurer)
├── package.json                 # Dépendances et scripts
├── tailwind.config.js           # Configuration Tailwind CSS
├── tsconfig.json                # Configuration TypeScript
└── next.config.ts               # Configuration Next.js
```

## Fichiers clés et leur rôle

### Configuration et environnement

- **`.env.local`** : Variables d'environnement pour Clerk, Supabase et Stripe
- **`middleware.ts`** : Protection des routes avec Clerk, définit les routes publiques/protégées
- **`tailwind.config.js`** : Configuration Tailwind avec thème personnalisé

### Application Next.js

- **`src/app/layout.tsx`** : Layout racine avec ClerkProvider pour l'authentification globale
- **`src/app/page.tsx`** : Page d'accueil avec design moderne, sections hero, features, pricing
- **`src/app/globals.css`** : Variables CSS pour le système de design (couleurs, espacements)

### Authentification (Clerk)

- **`src/app/(auth)/sign-in/page.tsx`** : Page de connexion avec composant Clerk
- **`src/app/(auth)/sign-up/page.tsx`** : Page d'inscription avec composant Clerk
- **Groupes de routes** : `(auth)` et `(protected)` pour organiser les routes

### Intégrations

- **`src/lib/supabase.ts`** : 
  - Client Supabase pour opérations côté client
  - Client admin pour opérations côté serveur (webhooks)
- **`src/lib/stripe.ts`** : 
  - Configuration Stripe
  - Fonctions pour checkout, gestion clients, abonnements

### Types et utilitaires

- **`src/types/index.ts`** : Types TypeScript pour User, Subscription, SubscriptionPlan
- **`src/lib/utils.ts`** : Fonction `cn()` pour combiner les classes CSS
- **`src/components/ui/button.tsx`** : Composant Button avec variants (primary, secondary, etc.)

## État actuel du développement

### ✅ Complété
- Configuration Next.js 14 avec TypeScript et Tailwind CSS
- Configuration Clerk pour l'authentification
- Pages de connexion/inscription
- Page d'accueil avec design moderne
- Middleware de protection des routes
- Configuration Supabase et Stripe (côté code)
- Système de composants UI de base

### 🚧 À faire
- Configuration des clés API dans `.env.local`
- Schéma de base de données Supabase
- Pages protégées (dashboard, settings)
- Page de tarification avec Stripe Checkout
- Webhooks Clerk et Stripe
- Logique de vérification d'abonnement
- Tests d'intégration

## Prochaines étapes

1. **Tester l'application actuelle** : Lancer le serveur de développement
2. **Configurer les services externes** : Clerk, Supabase, Stripe
3. **Créer le schéma de base de données** : Tables users, subscriptions
4. **Implémenter les pages protégées** : Dashboard et paramètres
5. **Intégrer les paiements** : Page pricing et Stripe Checkout
6. **Ajouter les webhooks** : Synchronisation des données
7. **Tests complets** : Flux d'authentification et paiement

## Technologies utilisées

- **Frontend** : Next.js 14 (App Router), React, TypeScript
- **Styling** : Tailwind CSS, Radix UI, Lucide Icons
- **Authentification** : Clerk
- **Base de données** : Supabase (PostgreSQL)
- **Paiements** : Stripe
- **Déploiement** : Vercel (recommandé)