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

## 🎯 Solution alternative : Third-Party Auth Integration (Optionnelle)

### Principe
Utiliser la fonctionnalité **Third-Party Auth Integration** de Supabase pour intégrer directement Clerk comme fournisseur d'authentification externe.

## 🔧 Étapes d'implémentation (Procédure officielle 2025)

### 1. Configuration dans Clerk

#### A. Personnaliser les tokens de session
1. Accéder au **tableau de bord Clerk**
2. Aller dans **Configure > Sessions**
3. Personnaliser les tokens de session pour inclure le claim `role` :
   ```json
   {
     "role": "authenticated",
     "sub": "{{user.id}}",
     "email": "{{user.primary_email_address.email_address}}"
   }
   ```

#### B. Configuration avancée (si nécessaire)
- Pour une configuration Postgres avancée, ajuster la valeur du rôle en conséquence
- Les utilisateurs authentifiés doivent avoir la valeur `authenticated` pour le claim `role`

### 2. Configuration dans Supabase

#### A. Intégration Third-Party Auth
1. Accéder à votre **projet Supabase**
2. Aller dans **Authentication > Third-Party Auth**
3. Cliquer sur **New Third-Party Auth Integration**
4. Sélectionner **Clerk**
5. Configurer les paramètres :
   - **Domaine Clerk** : `votre-domaine.clerk.accounts.dev`
   - **URL de configuration OpenID** : URL fournie par Clerk
   - **Identifiant client** : Client ID de Clerk
   - **Secret client** : Client Secret de Clerk

#### B. Configuration locale (développement)
Ajouter cette configuration à votre fichier `supabase/config.toml` :

```toml
[auth.third_party.clerk]
enabled = true
domain = "votre-domaine.clerk.accounts.dev"
```

### 3. Mise à jour des politiques RLS

#### A. Nouvelles politiques compatibles
```sql
-- Politique mise à jour pour utiliser auth.uid() directement
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);

-- Politique pour l'insertion (création d'utilisateur)
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

-- Politique pour la mise à jour
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_user_id);
```

#### B. Utilisation des claims JWT
```sql
-- Exemple d'utilisation des claims dans les politiques
CREATE POLICY "Authenticated users only" ON users
    FOR SELECT USING (
        (auth.jwt() ->> 'role')::text = 'authenticated'
    );
```

### 4. Implémentation côté client

#### A. Hook useSupabaseAuth (déjà créé)
Le hook `useSupabaseAuth` gère l'authentification automatique avec les tokens Clerk :

```typescript
// src/hooks/useSupabaseAuth.ts
'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function useSupabaseAuth(): SupabaseClient | null {
  const { getToken, isLoaded } = useAuth()
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const setupAuth = async () => {
      try {
        // Récupérer le token JWT de Clerk
        const token = await getToken()
        
        if (token) {
          console.log('Token Clerk récupéré pour Supabase')
          
          // Configurer l'authentification Supabase avec le token Clerk
          await client.auth.setSession({
            access_token: token,
            refresh_token: '',
          })
        }
        
        setSupabase(client)
      } catch (error) {
        console.error('Erreur auth Supabase:', error)
        setSupabase(client)
      }
    }

    setupAuth()
  }, [getToken, isLoaded])

  return supabase
}
```

#### B. Modification du hook useSubscription
```typescript
// src/hooks/useSubscription.ts
import { useSupabaseAuth } from './useSupabaseAuth'

export function useSubscription() {
  const { user } = useUser()
  const supabase = useSupabaseAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchSubscription() {
      if (!user || !supabase) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('subscription_status, current_period_end, stripe_customer_id')
          .eq('clerk_user_id', user.id)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            setSubscription(null) // Utilisateur pas encore créé
          } else {
            setError(error.message)
          }
        } else {
          setSubscription(data)
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données')
      } finally {
        setLoading(false)
      }
    }

    fetchSubscription()
  }, [user, supabase])

  // ... reste du hook
}
```

## 🧪 Configuration de développement et tests

### 1. Configuration de l'environnement local

#### A. Variables d'environnement
Vérifiez votre fichier `.env.local` :

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### B. Configuration des URL de callback
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