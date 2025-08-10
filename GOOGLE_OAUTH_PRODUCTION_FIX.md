# 🔧 Résolution : Erreur OAuth Google en Production

## 🚨 Problème Identifié

**Erreur** : `Missing required parameter: client_id`
**Contexte** : Authentification Google via Clerk sur le domaine `tidimondo.com`
**Cause** : Configuration OAuth Google non adaptée à la production

## 📋 Solution Étape par Étape

### Étape 1 : Configuration Clerk Dashboard

1. **Accéder au Clerk Dashboard**
   - URL : https://dashboard.clerk.com/
   - Sélectionnez votre projet : `wealthy-clam-25`

2. **Configurer Social Connections**
   ```
   Navigation : User & Authentication → Social Connections → Google
   ```

3. **Vérifications essentielles**
   - ✅ Google OAuth est activé
   - ✅ Client ID Google configuré
   - ✅ Client Secret Google configuré
   - ✅ Scopes appropriés (email, profile)

### Étape 2 : Configuration Google Cloud Console

1. **Accéder à Google Cloud Console**
   - URL : https://console.cloud.google.com/
   - Projet : Votre projet Google OAuth

2. **Configurer les URLs autorisées**
   ```
   Navigation : APIs & Services → Credentials → OAuth 2.0 Client IDs
   ```

3. **Authorized JavaScript origins**
   ```
   https://tidimondo.com
   https://www.tidimondo.com
   https://wealthy-clam-25.clerk.accounts.dev
   ```

4. **Authorized redirect URIs**
   ```
   https://tidimondo.com/api/auth/callback/google
   https://www.tidimondo.com/api/auth/callback/google
   https://wealthy-clam-25.clerk.accounts.dev/v1/oauth_callback
   ```

### Étape 3 : Variables d'Environnement Vercel

1. **Accéder à Vercel Dashboard**
   - URL : https://vercel.com/dashboard
   - Projet : tidimondo

2. **Configurer les variables d'environnement**
   ```bash
   # Variables Clerk (obligatoires)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   
   # URLs de redirection Clerk
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   
   # Variables Supabase (si utilisées)
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. **Redéployer après modification**
   ```bash
   # Automatique sur Vercel après modification des variables
   ```

### Étape 4 : Vérification de la Configuration

1. **Tester en local d'abord**
   ```bash
   npm run dev
   # Tester l'auth Google sur localhost:3000
   ```

2. **Vérifier les URLs Clerk**
   ```
   https://wealthy-clam-25.clerk.accounts.dev/.well-known/jwks.json
   ```

3. **Tester en production**
   ```
   https://tidimondo.com/sign-in
   # Cliquer sur "Continuer avec Google"
   ```

## 🔍 Diagnostic Avancé

### Vérifier les Logs Clerk

1. **Clerk Dashboard → Logs**
   - Filtrer par "OAuth" ou "Google"
   - Chercher les erreurs de client_id

### Vérifier les Headers de Requête

```javascript
// Dans les DevTools du navigateur
// Network → Filtrer par "oauth" ou "google"
// Vérifier la présence du client_id dans les requêtes
```

### Script de Test (Optionnel)

```javascript
// test-google-oauth.js
const testGoogleOAuth = async () => {
  try {
    const response = await fetch('https://wealthy-clam-25.clerk.accounts.dev/.well-known/openid_configuration');
    const config = await response.json();
    console.log('✅ Clerk OAuth Config:', config);
  } catch (error) {
    console.error('❌ Erreur config Clerk:', error);
  }
};

testGoogleOAuth();
```

## 🚨 Points Critiques

### 1. Environnement de Production vs Développement

- **Développement** : `pk_test_...` et `sk_test_...`
- **Production** : `pk_live_...` et `sk_live_...`

### 2. Domaines Autorisés

- Tous les domaines doivent être configurés dans Google Cloud Console
- Clerk doit connaître le domaine de production

### 3. HTTPS Obligatoire

- OAuth Google nécessite HTTPS en production
- Vercel fournit automatiquement HTTPS

## ✅ Checklist de Vérification

- [ ] Google OAuth activé dans Clerk Dashboard
- [ ] Client ID/Secret configurés dans Clerk
- [ ] Domaines autorisés dans Google Cloud Console
- [ ] URLs de redirection configurées
- [ ] Variables d'environnement Vercel correctes
- [ ] Clés de production (live) utilisées
- [ ] Test d'authentification Google réussi

## 🎯 Résultat Attendu

Après configuration complète :
- ✅ Bouton "Continuer avec Google" fonctionnel
- ✅ Redirection Google OAuth réussie
- ✅ Retour vers l'application après authentification
- ✅ Session utilisateur créée correctement

## 📞 Support

Si le problème persiste :
1. Vérifier les logs Clerk Dashboard
2. Contrôler les variables d'environnement Vercel
3. Tester avec un autre navigateur/mode incognito
4. Vérifier la synchronisation des horloges (JWT)