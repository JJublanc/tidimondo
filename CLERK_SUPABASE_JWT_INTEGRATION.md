# Intégration Clerk avec Supabase RLS - Guide Officiel 2025

## 📋 Problématique

### Contexte
Notre application utilise :
- **Clerk** pour l'authentification des utilisateurs
- **Supabase** comme base de données avec Row Level Security (RLS) activé
- **Next.js** comme framework frontend/backend

### Problème identifié
L'erreur `Erreur lors de la récupération de l'abonnement: {}` se produit car :

1. **RLS activé** : Supabase a Row Level Security activé sur la table `users`
2. **Politiques restrictives** : Les politiques RLS vérifient `auth.uid()::text = clerk_user_id`
3. **Authentification manquante** : Le client Supabase côté client n'a pas de token d'authentification
4. **Conflit d'auth** : Clerk gère l'auth mais Supabase ne reconnaît pas les tokens Clerk

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

## 🎯 Solution officielle : Third-Party Auth Integration

### Principe
Utiliser la nouvelle fonctionnalité **Third-Party Auth Integration** de Supabase pour intégrer directement Clerk comme fournisseur d'authentification externe.

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

## 🔄 Migration

Cette solution remplace l'approche actuelle qui utilisait directement le client Supabase sans authentification. Les avantages :

- ✅ Respect des politiques RLS
- ✅ Sécurité renforcée
- ✅ Cohérence entre Clerk et Supabase
- ✅ Pas besoin d'API routes supplémentaires
- ✅ Authentification unifiée