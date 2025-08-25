# Configuration Third-Party Auth Supabase pour Clerk

## 🎯 Problème Identifié

Clerk génère des JWT valides avec le template "supabase", mais **Supabase ne sait pas comment les valider** car il n'a pas la clé publique de Clerk.

## 🔧 Solution : Configurer Third-Party Auth

### Étape 1 : Accéder à la Configuration Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard/project/lytrlaotgttqxlrskbiz)
2. **Authentication** → **Settings** → **Auth Providers**
3. Cherchez la section **"Third-party Auth"** ou **"Custom JWT"**

### Étape 2 : Configurer le Provider Clerk

**Informations exactes pour votre projet :**

```json
{
  "provider_name": "clerk",
  "issuer": "https://wealthy-clam-25.clerk.accounts.dev",
  "jwks_uri": "https://wealthy-clam-25.clerk.accounts.dev/.well-known/jwks.json",
  "audience": "authenticated"
}
```

**✅ Domaine vérifié** : `wealthy-clam-25.clerk.accounts.dev`

**Clé publique JWT récupérée :**
```json
{
  "use": "sig",
  "kty": "RSA", 
  "kid": "ins_2zsa6nRIHmOPhuUKnKhtoBjXrdI",
  "alg": "RS256",
  "n": "1RcE3scekGQWpLZz5oH_jBFKtxBZ6wBzqKPxHO_f4uBRVR192GIPkPfe_q8wuE4DHDi08Gj9qFzMUjDUvDjolJ0frd_88tyfocNE2fjJDeypyO-yKvmgKm3mwu1a4iWPB_aJn9O8jwOpqIvlNabp0qLSLFolKS2stJCmsabckBYsSUIoROSC3C1yI3rZCqXhQspo5gcZCY9SOW9dP8FTUFSwtzMbGK1kwVVfCtR8GPgblirQMmzCAkb-ANWMmgS2yF8fSt0I_mFqBf8l5KwpHQ1S37ksrzqK5eeuIb6Bkh1JLXe6GO3rqO-c97BEMmjsGMDTRUzdRN9iypQKKHUP_Q",
  "e": "AQAB"
}
```

### Étape 3 : Configuration dans Supabase

#### Option A : Interface Web (Recommandé)
1. Dans Supabase Dashboard → **Authentication** → **Settings**
2. Scroll vers **"JWT Settings"** ou **"Custom Claims"**
3. Ajoutez un nouveau provider avec :
   - **Provider Name**: `clerk`
   - **Issuer**: `https://wealthy-clam-25.clerk.accounts.dev`
   - **JWKS URL**: `https://wealthy-clam-25.clerk.accounts.dev/.well-known/jwks.json`
   - **Audience**: `authenticated`

#### Option B : Configuration SQL (Alternative)
Si l'interface web n'est pas disponible, exécutez dans SQL Editor :

```sql
-- Configurer Third-Party Auth pour Clerk
INSERT INTO auth.saml_providers (id, sso_provider_id, attribute_mapping, metadata_xml)
VALUES (
  'clerk',
  'clerk',
  '{"email": "email", "name": "name"}',
  ''
);
```

### Étape 4 : Vérification

Après configuration, les tokens Clerk devraient être acceptés par Supabase avec :
- ✅ `aud`: "authenticated" 
- ✅ `role`: "authenticated"
- ✅ `sub`: ID utilisateur Clerk
- ✅ `iss`: "https://wealthy-clam-25.clerk.accounts.dev"

## 🚨 État Actuel

### JWT Template Clerk ✅
- Template "supabase" configuré
- Claims corrects : `aud`, `role`, `sub` automatique

### Supabase Third-Party Auth ❌
- **À CONFIGURER** : Accepter les tokens Clerk
- Nécessaire pour résoudre `AuthSessionMissingError`

## 🎯 Prochaines Étapes

1. **Configurer Third-Party Auth** dans Supabase Dashboard
2. **Tester l'authentification** après configuration
3. **Vérifier** que les erreurs 400 disparaissent

## 🔍 Diagnostic

Si les erreurs persistent après configuration :
1. Vérifier les logs Supabase Auth
2. Tester avec `debug-tokens.js`
3. Vérifier la synchronisation des horloges (JWT exp)

## 📋 Commandes de Test

```bash
# Tester le token Clerk
node debug-tokens.js "VOTRE_TOKEN_CLERK"

# Vérifier JWKS Clerk
curl https://wealthy-clam-25.clerk.accounts.dev/.well-known/jwks.json