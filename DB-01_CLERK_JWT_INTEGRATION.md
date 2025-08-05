# Intégration Clerk avec Supabase RLS - Guide Officiel 2025

## 📋 Problématique Résolue

### Contexte
Notre application utilise :
- **Clerk** pour l'authentification des utilisateurs
- **Supabase** comme base de données avec Row Level Security (RLS) activé
- **Next.js** comme framework frontend/backend

### Problèmes identifiés et résolus
1. **RLS activé** : Supabase a Row Level Security activé sur la table `users`
2. **Politiques restrictives** : Les politiques RLS vérifient `auth.jwt() ->> 'sub' = clerk_user_id`
3. **Création d'utilisateurs** : Besoin de créer automatiquement les utilisateurs lors de la première connexion
4. **Sécurité** : Bloquer la lecture directe de la table `users` côté client

### ✅ Solution finale : Stratégie RLS Hybride
Notre solution combine :
- **Création automatique** d'utilisateurs côté client via une fonction SQL sécurisée
- **Lecture bloquée** de la table `users` côté client pour la sécurité
- **Fonction SQL** avec `SECURITY DEFINER` pour gérer les permissions
- **Idempotence** avec `ON CONFLICT DO UPDATE` pour les utilisateurs existants

### Code problématique
```typescript
// Dans useSubscription.ts
const { data, error } = await supabase
  .from('users')
  .select('subscription_status, current_period_end, stripe_customer_id')
  .eq('clerk_user_id', user.id)
  .single() // ❌ Échoue à cause de RLS
```

### Politique RLS actuelle
```sql
-- Dans supabase-schema.sql
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);
```

## 🎯 Solution finale : Stratégie RLS Hybride avec Création Automatique

### Principe
Notre solution utilise une **stratégie RLS hybride** qui combine :
1. **Fonction SQL sécurisée** pour la création automatique d'utilisateurs
2. **Politiques RLS restrictives** pour bloquer la lecture directe côté client
3. **Intégration JWT Clerk** pour l'authentification
4. **Gestion idempotente** des utilisateurs existants

### Architecture de la solution

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Clerk Auth    │    │  useSubscription     │    │ Supabase Function   │
│                 │    │                      │    │                     │
│ • JWT Tokens    │───▶│ • create_user_profile│───▶│ • SECURITY DEFINER  │
│ • User ID       │    │ • Auto-création      │    │ • ON CONFLICT       │
│ • Email         │    │ • Gestion état       │    │ • Validation JWT    │
└─────────────────┘    └──────────────────────┘    └─────────────────────┘
                                │                            │
                                ▼                            ▼
                       ┌──────────────────────┐    ┌─────────────────────┐
                       │   État Application   │    │    Table users     │
                       │                      │    │                     │
                       │ • subscription_status│    │ • RLS Policies      │
                       │ • current_period_end │    │ • Lecture bloquée   │
                       │ • stripe_customer_id │    │ • Écriture contrôlée│
                       └──────────────────────┘    └─────────────────────┘
```

## 🔐 Politiques RLS Hybrides

### 1. Politique d'insertion (Permissive pour auto-création)
```sql
CREATE POLICY "Allow authenticated user creation" ON public.users
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'sub' IS NOT NULL
  );
```

### 2. Politique de lecture (Bloquée côté client)
```sql
CREATE POLICY "Block client reads" ON public.users
  FOR SELECT
  USING (false); -- Toujours false = aucune lecture côté client
```

### 3. Politique de mise à jour (Restrictive)
```sql
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE
  USING (
    auth.jwt() ->> 'sub' IS NOT NULL AND
    clerk_user_id = auth.jwt() ->> 'sub'
  );
```

### 4. Fonction de création sécurisée
```sql
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_clerk_user_id text,
  p_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Privilèges élevés
AS $$
DECLARE
  result_user public.users%ROWTYPE;
  jwt_sub text;
BEGIN
  -- Validation JWT
  jwt_sub := auth.jwt() ->> 'sub';
  
  IF jwt_sub IS NULL OR jwt_sub != p_clerk_user_id THEN
    RAISE EXCEPTION 'Unauthorized: JWT mismatch';
  END IF;

  -- Insertion idempotente
  INSERT INTO public.users (clerk_user_id, email, subscription_status)
  VALUES (p_clerk_user_id, p_email, 'free')
  ON CONFLICT (clerk_user_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now()
  RETURNING * INTO result_user;

  -- Retour sécurisé
  RETURN json_build_object(
    'id', result_user.id,
    'clerk_user_id', result_user.clerk_user_id,
    'subscription_status', result_user.subscription_status,
    'created_at', result_user.created_at
  );
END;
$$;
```

## 🚀 Implémentation côté client optimisée

### Hook useSubscription mis à jour
```typescript
// src/hooks/useSubscription.ts
export function useSubscription() {
  const { user, isLoaded } = useUser()
  const { supabase } = useSupabaseWithClerk()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) return

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // APPROCHE DIRECTE : Créer/mettre à jour l'utilisateur d'abord
        const { data: userResult, error: createError } = await supabase
          .rpc('create_user_profile', {
            p_clerk_user_id: user.id,
            p_email: user.emailAddresses[0]?.emailAddress || null
          })

        if (createError) {
          setError(`Erreur initialisation: ${createError.message}`)
          return
        }

        // Utiliser les données retournées par la fonction
        setSubscription({
          subscription_status: userResult.subscription_status || 'free',
          current_period_end: userResult.current_period_end || null,
          stripe_customer_id: userResult.stripe_customer_id || null
        })

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, isLoaded])

  const hasProAccess = subscription?.subscription_status === 'active'
  return { subscription, loading, error, hasProAccess }
}
```

## ✅ Avantages de cette approche

1. **Sécurité maximale** : Aucune lecture directe de la table `users` côté client
2. **Création automatique** : Les utilisateurs sont créés lors de la première connexion
3. **Idempotence** : Pas d'erreur si l'utilisateur existe déjà
4. **Performance** : Une seule requête pour créer/récupérer les données
5. **Simplicité** : Pas besoin de webhooks complexes pour la création
6. **Validation** : JWT vérifié côté serveur dans la fonction SQL

## 🎯 Solution Recommandée : Third-Party Auth Integration

### 🌟 Principe et Avantages
L'approche **Third-Party Auth Integration** de Supabase permet d'intégrer directement Clerk comme fournisseur d'authentification externe. Cette méthode offre plusieurs avantages :

- **Intégration native** : Supabase reconnaît automatiquement les tokens Clerk
- **Gestion simplifiée** : Pas besoin de fonctions SQL personnalisées
- **Sécurité renforcée** : Validation automatique des JWT par Supabase
- **Politiques RLS standard** : Utilisation directe de `auth.uid()`
- **Synchronisation automatique** : Les utilisateurs sont créés automatiquement dans `auth.users`

### 🏗️ Architecture de la Solution Third-Party

```mermaid
graph TB
    subgraph "Client (Next.js)"
        USER[Utilisateur]
        CLERK_UI[Clerk UI Components]
        APP[Application React]
    end
    
    subgraph "Clerk Service"
        CLERK_AUTH[Clerk Authentication]
        CLERK_JWT[JWT Token Generation]
        CLERK_API[Clerk API]
    end
    
    subgraph "Supabase"
        SUPA_AUTH[Supabase Auth]
        SUPA_RLS[RLS Policies]
        SUPA_DB[Database]
        THIRD_PARTY[Third-Party Integration]
    end
    
    USER --> CLERK_UI
    CLERK_UI --> CLERK_AUTH
    CLERK_AUTH --> CLERK_JWT
    CLERK_JWT --> APP
    
    APP --> SUPA_AUTH
    SUPA_AUTH --> THIRD_PARTY
    THIRD_PARTY --> CLERK_API
    SUPA_AUTH --> SUPA_RLS
    SUPA_RLS --> SUPA_DB
```

## 🔧 Guide d'Implémentation Détaillé

### 1. Configuration Clerk (Étapes Détaillées)

#### A. Accès au Dashboard Clerk
1. **Se connecter** sur [dashboard.clerk.com](https://dashboard.clerk.com)
2. **Sélectionner** votre application/instance
3. **Vérifier** que vous êtes sur la bonne instance (dev/prod)

#### B. Configuration des Session Tokens
1. **Navigation** : Dashboard → **Configure** → **Sessions**
2. **Localiser** la section "Customize session token"
3. **Cliquer** sur "Edit" ou "Customize"
4. **Ajouter** les claims personnalisés :

```json
{
  "role": "authenticated",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address.email_address}}",
  "aud": "authenticated",
  "iss": "https://{{domain}}.clerk.accounts.dev"
}
```

#### C. Configuration OpenID Connect
1. **Navigation** : Dashboard → **Configure** → **SSO Connections**
2. **Activer** OpenID Connect si pas déjà fait
3. **Noter** l'URL de configuration OpenID : `https://votre-domaine.clerk.accounts.dev/.well-known/openid_configuration`

#### D. Récupération des Identifiants
1. **Navigation** : Dashboard → **Configure** → **API Keys**
2. **Copier** :
   - **Publishable Key** : `pk_test_xxx` ou `pk_live_xxx`
   - **Secret Key** : `sk_test_xxx` ou `sk_live_xxx`
3. **Navigation** : Dashboard → **Configure** → **SSO Connections**
4. **Copier** :
   - **Client ID** : Identifiant unique de votre application
   - **Client Secret** : Secret pour l'authentification serveur

### 2. Configuration Supabase (Procédure Complète)

#### A. Accès au Dashboard Supabase
1. **Se connecter** sur [supabase.com/dashboard](https://supabase.com/dashboard)
2. **Sélectionner** votre projet
3. **Vérifier** que vous êtes sur le bon projet (dev/prod)

#### B. Configuration Third-Party Auth
1. **Navigation** : Dashboard → **Authentication** → **Providers**
2. **Faire défiler** jusqu'à "Third-party providers"
3. **Cliquer** sur "Add provider" ou "Configure"
4. **Sélectionner** "Custom" ou "OpenID Connect"

#### C. Paramètres de Configuration
```
Provider Name: Clerk
Client ID: [Votre Client ID Clerk]
Client Secret: [Votre Client Secret Clerk]
Issuer URL: https://votre-domaine.clerk.accounts.dev
Authorization URL: https://votre-domaine.clerk.accounts.dev/oauth/authorize
Token URL: https://votre-domaine.clerk.accounts.dev/oauth/token
User Info URL: https://votre-domaine.clerk.accounts.dev/oauth/userinfo
```

#### D. Configuration Locale (Développement)
Modifier votre fichier [`supabase/config.toml`](supabase/config.toml) :

```toml
[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]

[auth.third_party.clerk]
enabled = true
client_id = "your_clerk_client_id"
secret = "your_clerk_client_secret"
redirect_uri = "http://localhost:3000/auth/callback"
```

### 3. Variables d'Environnement Mises à Jour

#### A. Variables Clerk
```bash
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_CLIENT_ID=your_clerk_client_id
CLERK_CLIENT_SECRET=your_clerk_client_secret

# URLs Clerk
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### B. Variables Supabase
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Third-Party Auth
SUPABASE_JWT_SECRET=your_jwt_secret
```

### 4. Politiques RLS pour Third-Party Auth

#### A. Politiques RLS Optimisées
Avec l'intégration Third-Party, Supabase gère automatiquement l'authentification et peuple la table `auth.users`. Les politiques RLS peuvent utiliser directement `auth.uid()` :

```sql
-- Politique de lecture (recommandée pour Third-Party Auth)
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (
        auth.uid()::text = clerk_user_id
    );

-- Politique d'insertion (création automatique d'utilisateur)
CREATE POLICY "Users can insert own data" ON public.users
    FOR INSERT WITH CHECK (
        auth.uid()::text = clerk_user_id AND
        auth.role() = 'authenticated'
    );

-- Politique de mise à jour
CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (
        auth.uid()::text = clerk_user_id AND
        auth.role() = 'authenticated'
    );

-- Politique de suppression (optionnelle)
CREATE POLICY "Users can delete own data" ON public.users
    FOR DELETE USING (
        auth.uid()::text = clerk_user_id AND
        auth.role() = 'authenticated'
    );
```

#### B. Politiques Avancées avec Claims JWT
```sql
-- Utilisation des claims personnalisés
CREATE POLICY "Email verified users only" ON public.users
    FOR SELECT USING (
        auth.jwt() ->> 'email_verified' = 'true'
    );

-- Politique basée sur le rôle
CREATE POLICY "Authenticated users with role" ON public.users
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'authenticated' AND
        auth.uid() IS NOT NULL
    );

-- Politique pour les administrateurs (si vous avez des rôles)
CREATE POLICY "Admin access" ON public.users
    FOR ALL USING (
        (auth.jwt() ->> 'role')::text = 'admin' OR
        auth.uid()::text = clerk_user_id
    );
```

#### C. Fonction de Synchronisation Automatique
```sql
-- Fonction pour synchroniser automatiquement les utilisateurs Clerk
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (clerk_user_id, email, subscription_status)
    VALUES (
        NEW.raw_user_meta_data ->> 'sub',
        NEW.email,
        'free'
    )
    ON CONFLICT (clerk_user_id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour exécuter la fonction lors de la création d'un utilisateur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5. Implémentation Côté Client Optimisée

#### A. Hook useSupabaseWithClerk (Version Third-Party Auth)
```typescript
// src/hooks/useSupabaseWithClerk.ts
'use client'

import { useAuth, useSession } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function useSupabaseWithClerk(): {
  supabase: SupabaseClient | null
  isAuthenticated: boolean
  isLoading: boolean
} {
  const { session, isLoaded: sessionLoaded } = useSession()
  const { isSignedIn, isLoaded: authLoaded } = useAuth()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!sessionLoaded || !authLoaded) return

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const setupAuth = async () => {
      try {
        if (session && isSignedIn) {
          // Récupérer le token JWT de Clerk avec template personnalisé
          const token = await session.getToken({
            template: 'supabase' // Template configuré dans Clerk
          })
          
          if (token) {
            console.log('🔑 Token Clerk récupéré pour Supabase')
            
            // Authentifier avec Supabase via Third-Party Auth
            const { data, error } = await client.auth.setSession({
              access_token: token,
              refresh_token: '', // Pas nécessaire avec Third-Party Auth
            })
            
            if (error) {
              console.error('❌ Erreur auth Supabase:', error)
              setIsAuthenticated(false)
            } else {
              console.log('✅ Authentification Supabase réussie')
              setIsAuthenticated(true)
            }
          }
        } else {
          // Déconnexion
          await client.auth.signOut()
          setIsAuthenticated(false)
        }
        
        setSupabase(client)
      } catch (error) {
        console.error('❌ Erreur setup auth:', error)
        setSupabase(client)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    setupAuth()
  }, [session, isSignedIn, sessionLoaded, authLoaded])

  return { supabase, isAuthenticated, isLoading }
}
```

#### B. Hook useSubscription Optimisé
```typescript
// src/hooks/useSubscription.ts
'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { useSupabaseWithClerk } from './useSupabaseWithClerk'

interface SubscriptionData {
  subscription_status: string
  current_period_end: string | null
  stripe_customer_id: string | null
}

export function useSubscription() {
  const { user, isLoaded: userLoaded } = useUser()
  const { supabase, isAuthenticated, isLoading: authLoading } = useSupabaseWithClerk()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userLoaded || authLoading || !user || !supabase || !isAuthenticated) {
      setLoading(false)
      return
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true)
        setError(null)

        // Avec Third-Party Auth, l'utilisateur est automatiquement créé
        // On peut directement interroger la table users
        const { data, error: queryError } = await supabase
          .from('users')
          .select('subscription_status, current_period_end, stripe_customer_id')
          .eq('clerk_user_id', user.id)
          .single()

        if (queryError) {
          if (queryError.code === 'PGRST116') {
            // Utilisateur pas encore créé, on le crée automatiquement
            console.log('👤 Création automatique de l\'utilisateur')
            
            const { data: newUser, error: insertError } = await supabase
              .from('users')
              .insert({
                clerk_user_id: user.id,
                email: user.emailAddresses[0]?.emailAddress || null,
                subscription_status: 'free'
              })
              .select('subscription_status, current_period_end, stripe_customer_id')
              .single()

            if (insertError) {
              setError(`Erreur création utilisateur: ${insertError.message}`)
            } else {
              setSubscription(newUser)
            }
          } else {
            setError(`Erreur requête: ${queryError.message}`)
          }
        } else {
          setSubscription(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, supabase, isAuthenticated, userLoaded, authLoading])

  const hasProAccess = subscription?.subscription_status === 'active'
  
  return {
    subscription,
    loading,
    error,
    hasProAccess,
    isAuthenticated
  }
}
```

#### C. Configuration du Layout Principal
```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { frFR } from '@clerk/localizations'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      localization={frFR}
      appearance={{
        baseTheme: undefined, // ou votre thème personnalisé
        variables: {
          colorPrimary: '#000000',
        },
      }}
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
    >
      <html lang="fr">
        <body>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

### 6. Configuration des Templates JWT dans Clerk

#### A. Création du Template Supabase
1. **Dashboard Clerk** → **Configure** → **JWT Templates**
2. **Cliquer** sur "New template"
3. **Nom** : `supabase`
4. **Configuration** :

```json
{
  "aud": "authenticated",
  "exp": "{{session.expire_at}}",
  "iat": "{{session.created_at}}",
  "iss": "https://{{domain}}.clerk.accounts.dev",
  "nbf": "{{session.created_at}}",
  "sub": "{{user.id}}",
  "email": "{{user.primary_email_address.email_address}}",
  "phone": "{{user.primary_phone_number.phone_number}}",
  "app_metadata": {
    "provider": "clerk",
    "providers": ["clerk"]
  },
  "user_metadata": {
    "email": "{{user.primary_email_address.email_address}}",
    "email_verified": "{{user.primary_email_address.verification.status == 'verified'}}",
    "phone_verified": "{{user.primary_phone_number.verification.status == 'verified'}}",
    "sub": "{{user.id}}"
  },
  "role": "authenticated"
}
```

#### B. Utilisation du Template
```typescript
// Dans votre hook useSupabaseWithClerk
const token = await session.getToken({
  template: 'supabase' // Utilise le template configuré
})
```

### 7. Tests et Validation de l'Intégration

#### A. Tests de Connexion
```typescript
// tests/integration/clerk-supabase.test.ts
import { createClient } from '@supabase/supabase-js'

describe('Clerk-Supabase Integration', () => {
  test('should authenticate with Clerk token', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Simuler un token Clerk valide
    const mockToken = 'eyJ...' // Token de test
    
    const { data, error } = await supabase.auth.setSession({
      access_token: mockToken,
      refresh_token: '',
    })

    expect(error).toBeNull()
    expect(data.session).toBeDefined()
  })

  test('should access user data with RLS', async () => {
    // Test des politiques RLS
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', 'test_user_id')

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})
```

#### B. Script de Debug
```typescript
// scripts/debug-auth.ts
import { createClient } from '@supabase/supabase-js'

async function debugAuth() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Vérifier la session actuelle
  const { data: session } = await supabase.auth.getSession()
  console.log('📋 Session actuelle:', session)

  // Vérifier l'utilisateur
  const { data: user } = await supabase.auth.getUser()
  console.log('👤 Utilisateur:', user)

  // Tester les politiques RLS
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  console.log('🔒 Test RLS:', { data, error })
}

debugAuth()
```

#### C. Monitoring et Logs
```typescript
// src/lib/auth-monitor.ts
export class AuthMonitor {
  static logAuthEvent(event: string, data?: any) {
    console.log(`🔐 [AUTH] ${event}:`, data)
    
    // En production, envoyer à votre service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket, etc.
    }
  }

  static logAuthError(error: Error, context?: string) {
    console.error(`❌ [AUTH ERROR] ${context}:`, error)
    
    // En production, alerter l'équipe
    if (process.env.NODE_ENV === 'production') {
      // Alerting service
    }
  }
}
```

## 🧪 Configuration de Développement et Tests

### 1. Configuration Multi-Environnements

#### A. Variables d'Environnement par Environnement

**Développement (`.env.local`)**
```bash
# Clerk Configuration (Instance de développement)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_CLIENT_ID=your_dev_client_id
CLERK_CLIENT_SECRET=your_dev_client_secret

# Supabase Configuration (Projet de développement)
NEXT_PUBLIC_SUPABASE_URL=https://xxx-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dev_service_key

# URLs de redirection
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

**Production (Vercel Environment Variables)**
```bash
# Clerk Configuration (Instance de production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_CLIENT_ID=your_prod_client_id
CLERK_CLIENT_SECRET=your_prod_client_secret

# Supabase Configuration (Projet de production)
NEXT_PUBLIC_SUPABASE_URL=https://xxx-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.prod_service_key
```

#### B. Configuration des Domaines et Redirections

**Clerk Dashboard - Développement**
```
Allowed Origins:
- http://localhost:3000
- http://127.0.0.1:3000

Redirect URLs:
- http://localhost:3000/auth/callback
- http://localhost:3000/dashboard
```

**Clerk Dashboard - Production**
```
Allowed Origins:
- https://votre-domaine.com
- https://www.votre-domaine.com

Redirect URLs:
- https://votre-domaine.com/auth/callback
- https://votre-domaine.com/dashboard
```

### 2. Procédures de Test

#### A. Test de l'Authentification Complète
```bash
# 1. Démarrer l'application
npm run dev

# 2. Ouvrir http://localhost:3000
# 3. Cliquer sur "Se connecter"
# 4. Vérifier la redirection vers Clerk
# 5. Se connecter avec un compte test
# 6. Vérifier la redirection vers /dashboard
# 7. Ouvrir la console développeur
# 8. Vérifier les logs d'authentification
```

#### B. Test des Politiques RLS
```sql
-- Dans Supabase SQL Editor
-- Test 1: Vérifier qu'un utilisateur authentifié peut lire ses données
SELECT * FROM users WHERE clerk_user_id = 'user_test_id';

-- Test 2: Vérifier qu'un utilisateur ne peut pas lire les données d'un autre
SELECT * FROM users WHERE clerk_user_id != 'user_test_id';

-- Test 3: Vérifier la création automatique d'utilisateur
INSERT INTO users (clerk_user_id, email, subscription_status)
VALUES ('new_user_id', 'test@example.com', 'free');
```

#### C. Test de Performance
```typescript
// scripts/performance-test.ts
async function testAuthPerformance() {
  const start = performance.now()
  
  // Test de connexion
  const supabase = createClient(...)
  const { data, error } = await supabase.auth.getSession()
  
  const end = performance.now()
  console.log(`⏱️ Auth time: ${end - start}ms`)
  
  // Test de requête avec RLS
  const queryStart = performance.now()
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .limit(1)
  const queryEnd = performance.now()
  
  console.log(`⏱️ Query time: ${queryEnd - queryStart}ms`)
}
```

## 🚀 Déploiement et Production

### 1. Checklist de Déploiement

#### A. Pré-déploiement
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Template JWT Supabase créé dans Clerk
- [ ] Third-Party Auth configuré dans Supabase
- [ ] Politiques RLS testées et validées
- [ ] Domaines de production configurés dans Clerk
- [ ] Tests d'intégration passés

#### B. Post-déploiement
- [ ] Test de connexion en production
- [ ] Vérification des logs d'authentification
- [ ] Test de création d'utilisateur automatique
- [ ] Monitoring des erreurs activé
- [ ] Performance de l'authentification validée

### 2. Monitoring et Maintenance

#### A. Métriques à Surveiller
```typescript
// Métriques importantes
const metrics = {
  authSuccessRate: 'Taux de succès d\'authentification',
  authLatency: 'Latence d\'authentification',
  rls_policy_errors: 'Erreurs de politiques RLS',
  user_creation_rate: 'Taux de création d\'utilisateurs',
  token_refresh_errors: 'Erreurs de rafraîchissement de token'
}
```

#### B. Alertes Recommandées
- Taux d'erreur d'authentification > 5%
- Latence d'authentification > 2 secondes
- Échecs de création d'utilisateur
- Erreurs de politiques RLS fréquentes

## 📚 Ressources et Documentation

### 1. Documentation Officielle
- [Clerk Third-Party Integrations](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party-auth)
- [JWT Templates Clerk](https://clerk.com/docs/backend-requests/making/jwt-templates)

### 2. Guides Complémentaires
- [Row Level Security Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Clerk Session Management](https://clerk.com/docs/references/nextjs/auth-object)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

## ✅ Résumé de l'Approche Third-Party Auth

### Avantages de cette Solution
1. **Intégration Native** : Supabase reconnaît automatiquement les tokens Clerk
2. **Sécurité Renforcée** : Validation automatique des JWT par Supabase
3. **Simplicité** : Pas besoin de fonctions SQL personnalisées complexes
4. **Synchronisation** : Utilisateurs créés automatiquement dans `auth.users`
5. **Politiques RLS Standard** : Utilisation directe de `auth.uid()`
6. **Évolutivité** : Facilite l'ajout de nouveaux environnements

### Points Clés de Configuration
- **Template JWT personnalisé** dans Clerk avec les claims requis
- **Third-Party Auth Integration** configurée dans Supabase
- **Politiques RLS optimisées** utilisant `auth.uid()`
- **Hooks React** adaptés pour la gestion d'état
- **Variables d'environnement** séparées par environnement

Cette approche Third-Party Auth est recommandée pour une intégration robuste et maintenable entre Clerk et Supabase.
Dans le tableau de bord Clerk, configurez :
- **Développement local (Next.js)** : `http://localhost:3000/auth/callback`
- **Applications mobiles** : `app://auth/callback`

#### C. Configuration Supabase locale (optionnelle)
```bash
# Installer Supabase CLI
npm install -g supabase-cli

# Se connecter
supabase login

# Initialiser le projet local
supabase init

# Démarrer les services locaux
supabase start
```

### 2. Implémentation de l'authentification

#### A. Configuration du provider Clerk
```typescript
// src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="fr">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

#### B. Hook d'authentification amélioré
```typescript
// src/hooks/useSupabaseAuth.ts (version mise à jour)
import { useAuth, useSession } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function useSupabaseAuth(): SupabaseClient | null {
  const { session } = useSession()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const setupAuth = async () => {
      if (session) {
        try {
          // Récupérer le token Clerk
          const token = await session.getToken()
          
          if (token) {
            console.log('Token Clerk récupéré:', token.substring(0, 20) + '...')
            
            // Synchroniser avec Supabase
            const { error } = await client.auth.setSession({
              access_token: token,
              refresh_token: '',
            })
            
            if (error) {
              console.error('Erreur auth Supabase:', error)
            } else {
              console.log('Authentification Supabase réussie')
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du token:', error)
        }
      }
      
      setSupabase(client)
    }

    setupAuth()
  }, [session])

  return supabase
}
```

### 3. Debugging et vérification

#### A. Vérification des tokens
```typescript
// Utilitaire de debug
export async function debugAuth() {
  const { session } = useSession()
  
  if (session) {
    const token = await session.getToken()
    
    // Décoder le token (utiliser JWT.io pour vérifier)
    console.log('Token Clerk:', token)
    
    // Vérifier les claims
    const payload = JSON.parse(atob(token.split('.')[1]))
    console.log('Claims JWT:', payload)
  }
}
```

#### B. Logs détaillés
```typescript
// Dans useSupabaseAuth.ts
console.log('Clerk Session:', session)
console.log('Supabase User:', await supabase.auth.getUser())
console.log('Supabase Session:', await supabase.auth.getSession())
```

#### C. Outils de développement
- **Extension Chrome** : Clerk DevTools
- **Supabase Studio** : Pour vérifier les utilisateurs dans la base
- **Onglets Réseau** : Pour suivre les requêtes d'authentification
- **JWT.io** : Pour décoder et vérifier les tokens

### 4. Tests de validation

#### A. Test de connexion
```typescript
// Test simple dans un composant
export function AuthTest() {
  const { user } = useUser()
  const supabase = useSupabaseAuth()
  
  const testConnection = async () => {
    if (!supabase || !user) return
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single()
        
      console.log('Test résultat:', { data, error })
    } catch (err) {
      console.error('Test échoué:', err)
    }
  }
  
  return (
    <button onClick={testConnection}>
      Tester la connexion Supabase
    </button>
  )
}
```

#### B. Vérification RLS
```bash
# Tester directement avec curl
curl -H "Authorization: Bearer YOUR_CLERK_JWT" \
     -H "apikey: YOUR_SUPABASE_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/users?select=*"
```

## 📚 Ressources

- [Supabase Third-Party Auth](https://supabase.com/docs/guides/auth/third-party-auth)
- [Clerk JWT Templates](https://clerk.com/docs/backend-requests/making/jwt-templates)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Clerk](https://clerk.com/docs/quickstarts/nextjs)

## 🚨 Points d'attention

1. **Sécurité** : S'assurer que les claims JWT contiennent les bonnes informations
2. **Performance** : Mettre en cache les tokens pour éviter les appels répétés
3. **Expiration** : Gérer le renouvellement automatique des tokens
4. **Fallback** : Prévoir un mécanisme de fallback en cas d'échec d'authentification
5. **CORS** : Vérifier la configuration CORS pour les requêtes cross-origin

## 🔄 Migration vers la Stratégie RLS Hybride

### Évolution de l'approche

**Ancienne approche** (problématique) :
- Lecture directe de la table `users` côté client
- Erreurs RLS constantes
- Création d'utilisateurs via webhooks uniquement

**Nouvelle approche** (solution finale) :
- Fonction SQL sécurisée pour création automatique
- Lecture bloquée côté client (sécurité)
- Gestion idempotente des utilisateurs

### Migrations appliquées

1. **Migration initiale** : [`20250124000001_restore_clerk_auth.sql`](supabase/migrations/20250124000001_restore_clerk_auth.sql)
   - Restauration de la structure Clerk
   - Table `users` avec `clerk_user_id`

2. **Stratégie hybride** : [`20250130000000_hybrid_rls_strategy.sql`](supabase/migrations/20250130000000_hybrid_rls_strategy.sql)
   - Politiques RLS hybrides
   - Fonction `create_user_profile`

3. **Correction permissions** : [`20250131000000_fix_function_permissions.sql`](supabase/migrations/20250131000000_fix_function_permissions.sql)
   - `SECURITY DEFINER` pour la fonction
   - Permissions explicites

### Avantages de la solution finale

- ✅ **Sécurité maximale** : Lecture bloquée côté client
- ✅ **Création automatique** : Pas besoin de webhooks pour les utilisateurs
- ✅ **Idempotence** : Gestion des utilisateurs existants
- ✅ **Performance** : Une seule requête pour créer/récupérer
- ✅ **Simplicité** : Logique centralisée dans la fonction SQL
- ✅ **Validation** : JWT vérifié côté serveur
- ✅ **Cohérence** : Intégration Clerk-Supabase transparente

### Fichiers modifiés

- [`src/hooks/useSubscription.ts`](src/hooks/useSubscription.ts) : Logique optimisée
- [`src/hooks/useSupabaseWithClerk.ts`](src/hooks/useSupabaseWithClerk.ts) : Intégration JWT
- Migrations Supabase : Politiques RLS et fonctions

### Tests de validation

La solution a été testée pour :
- ✅ Création automatique de nouveaux utilisateurs
- ✅ Gestion des utilisateurs existants (idempotence)
- ✅ Sécurité RLS (lecture bloquée côté client)
- ✅ Intégration JWT Clerk-Supabase
- ✅ Performance et stabilité

## 🎯 Résumé de la solution

Notre **Stratégie RLS Hybride** résout définitivement les problèmes d'intégration Clerk-Supabase en combinant :

1. **Fonction SQL sécurisée** (`create_user_profile`) avec `SECURITY DEFINER`
2. **Politiques RLS restrictives** qui bloquent la lecture côté client
3. **Création automatique** d'utilisateurs lors de la première connexion
4. **Gestion idempotente** avec `ON CONFLICT DO UPDATE`
5. **Validation JWT** côté serveur pour la sécurité

Cette approche élimine le besoin de webhooks complexes pour la création d'utilisateurs tout en maintenant une sécurité maximale.