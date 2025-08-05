# 🔧 Templates de Configuration d'Environnement
## Tidimondo - Variables d'Environnement par Service

---

## 📁 Structure des Fichiers Recommandée

```
├── .env.example                 # Template public (à commiter)
├── .env.local                   # Development local (git-ignored)
├── .env.production             # Production (Vercel uniquement)
├── .env.staging                # Staging futur (Vercel uniquement)
└── environments/
    ├── development.env.example  # Template dev
    ├── production.env.example   # Template prod
    └── staging.env.example      # Template staging
```

---

## 🛠️ Template Développement Local

### `.env.local` (Development)
```bash
# =============================================================================
# TIDIMONDO - CONFIGURATION DÉVELOPPEMENT LOCAL
# =============================================================================

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================================================
# CLERK AUTHENTICATION (Development Instance)
# =============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# SUPABASE DATABASE (Development Project)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxx
SUPABASE_JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Local (optionnel si vous utilisez supabase start)
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.local_key
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.local_service_key

# =============================================================================
# STRIPE PAYMENTS (Test Mode)
# =============================================================================
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Product IDs (Test)
STRIPE_PRICE_ID_BASIC=price_xxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# AUTRES SERVICES (Development)
# =============================================================================

# Logging
LOG_LEVEL=debug

# Features Flags
NEXT_PUBLIC_FEATURE_ANALYTICS=false
NEXT_PUBLIC_FEATURE_BETA_FEATURES=true
```

---

## 🚀 Template Production

### `.env.production` (Production - Vercel)
```bash
# =============================================================================
# TIDIMONDO - CONFIGURATION PRODUCTION
# =============================================================================

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com

# =============================================================================
# CLERK AUTHENTICATION (Production Instance)
# =============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# SUPABASE DATABASE (Production Project)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxx
SUPABASE_JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# STRIPE PAYMENTS (Live Mode)
# =============================================================================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Product IDs (Live)
STRIPE_PRICE_ID_BASIC=price_xxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# AUTRES SERVICES (Production)
# =============================================================================

# Logging
LOG_LEVEL=error

# Features Flags
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_BETA_FEATURES=false

# Monitoring
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxxxx
```

---

## 🧪 Template Staging (Futur)

### `.env.staging` (Staging - Vercel Preview)
```bash
# =============================================================================
# TIDIMONDO - CONFIGURATION STAGING
# =============================================================================

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://tidimondo-staging.vercel.app

# =============================================================================
# CLERK AUTHENTICATION (Staging Instance)
# =============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# SUPABASE DATABASE (Staging Project)
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxx
SUPABASE_JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# STRIPE PAYMENTS (Test Mode - Staging)
# =============================================================================
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Stripe Product IDs (Test - Staging)
STRIPE_PRICE_ID_BASIC=price_xxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_PRO=price_xxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxxxxxxxxxxxxxxx

# =============================================================================
# AUTRES SERVICES (Staging)
# =============================================================================

# Logging
LOG_LEVEL=info

# Features Flags
NEXT_PUBLIC_FEATURE_ANALYTICS=true
NEXT_PUBLIC_FEATURE_BETA_FEATURES=true
```

---

## 📋 Template Public (.env.example)

### `.env.example` (À commiter dans Git)
```bash
# =============================================================================
# TIDIMONDO - TEMPLATE DE CONFIGURATION
# Copiez ce fichier vers .env.local et remplissez les valeurs
# =============================================================================

# Environment
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================================================
# CLERK AUTHENTICATION
# Obtenez vos clés sur https://dashboard.clerk.com
# =============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Clerk URLs (généralement pas besoin de changer)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook (configuré dans le dashboard Clerk)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# =============================================================================
# SUPABASE DATABASE
# Obtenez vos clés sur https://supabase.com/dashboard
# =============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here

# =============================================================================
# STRIPE PAYMENTS
# Obtenez vos clés sur https://dashboard.stripe.com
# =============================================================================
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Product IDs (créés dans le dashboard Stripe)
STRIPE_PRICE_ID_BASIC=price_your_basic_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_price_id
STRIPE_PRICE_ID_ENTERPRISE=price_your_enterprise_price_id

# =============================================================================
# AUTRES SERVICES
# =============================================================================

# Logging
LOG_LEVEL=debug

# Features Flags
NEXT_PUBLIC_FEATURE_ANALYTICS=false
NEXT_PUBLIC_FEATURE_BETA_FEATURES=true
```

---

## 🔧 Configuration Vercel

### Variables d'Environnement Vercel

#### Production
```bash
# Dans Vercel Dashboard > Settings > Environment Variables
# Environment: Production

NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com

# Clerk (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
SUPABASE_JWT_SECRET=xxx

# Stripe (Live)
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

#### Preview/Staging (Futur)
```bash
# Dans Vercel Dashboard > Settings > Environment Variables
# Environment: Preview

NODE_ENV=production
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_APP_URL=https://tidimondo-git-staging.vercel.app

# Clerk (Staging)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Supabase (Staging)
NEXT_PUBLIC_SUPABASE_URL=https://xxx-staging.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
SUPABASE_JWT_SECRET=xxx

# Stripe (Test)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

## 🛡️ Sécurité et Bonnes Pratiques

### Variables Sensibles
- ❌ **Ne jamais commiter** : `.env.local`, `.env.production`
- ✅ **Commiter** : `.env.example`, templates dans `/environments/`
- 🔒 **Chiffrer** : Variables de production dans Vercel
- 🔄 **Rotation** : Clés API tous les 6 mois

### Validation des Variables
```typescript
// src/lib/env.ts
export const env = {
  NODE_ENV: process.env.NODE_ENV!,
  APP_ENV: process.env.NEXT_PUBLIC_APP_ENV!,
  
  // Clerk
  CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY!,
  
  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
}

// Validation au démarrage
Object.entries(env).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
})
```

---

## 📝 Instructions de Migration

### Étape 1 : Sauvegarde
```bash
# Sauvegarder votre .env.local actuel
cp .env.local .env.local.backup
```

### Étape 2 : Restructuration
```bash
# Créer la structure
mkdir -p environments

# Copier le template
cp .env.example .env.local

# Remplir avec vos vraies valeurs
# Éditer .env.local avec vos clés actuelles
```

### Étape 3 : Validation
```bash
# Tester l'application
npm run dev

# Vérifier les connexions
npm run test:connections
```

### Étape 4 : Configuration Vercel
1. Aller dans Vercel Dashboard
2. Settings > Environment Variables
3. Ajouter les variables de production
4. Redéployer

---

*Document créé le : 2025-01-28*  
*Version : 1.0*  
*Lié à : ARCHITECTURE_STRATEGY.md*