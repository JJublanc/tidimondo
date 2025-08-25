# 05 - Dépannage et Résolution des Problèmes Stripe

## 🎯 Objectif

Ce guide couvre la résolution des problèmes courants rencontrés lors de l'intégration Stripe dans TidiMondo.

## 🚨 Problèmes de configuration

### Problème 1 : Price ID non trouvé

**Symptômes :**
```bash
Error: No such price: 'price_1ABC123...'
```

**Causes possibles :**
- Price ID incorrect ou inexistant
- Mauvais environnement (test vs live)
- Price ID supprimé dans Stripe

**Solutions :**

1. **Vérifier le Price ID dans Stripe Dashboard**
   ```bash
   # Dashboard Stripe → Products → Votre produit → Copier le Price ID
   ```

2. **Valider la variable d'environnement**
   ```bash
   grep NEXT_PUBLIC_STRIPE_PRICE_ID .env.local
   # Doit afficher : NEXT_PUBLIC_STRIPE_PRICE_ID=price_1ABC123...
   ```

3. **Tester avec Stripe CLI**
   ```bash
   stripe prices list --limit 5
   # Vérifier que votre Price ID apparaît dans la liste
   ```

### Problème 2 : Clés API incorrectes

**Symptômes :**
```bash
Error: Invalid API Key provided
```

**Solutions :**

1. **Vérifier les clés dans .env.local**
   ```bash
   # Clés de test (développement)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   
   # Clés live (production)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Régénérer les clés si nécessaire**
   - Dashboard Stripe → Developers → API keys → Regenerate

## 🔗 Problèmes de webhooks

### Problème 3 : Webhooks retournent [400]

**Symptômes :**
```bash
2025-07-20 21:06:35  <--  [400] POST http://localhost:3000/api/webhooks/stripe
```

**Cause principale :** Webhook secret incorrect

**Solutions :**

1. **Vérifier le secret Stripe CLI**
   ```bash
   # Quand vous lancez stripe listen, copiez le secret affiché :
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   > Ready! Your webhook signing secret is whsec_1234567890abcdef...
   ```

2. **Mettre à jour .env.local**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
   ```

3. **Redémarrer l'application**
   ```bash
   # L'app se recharge automatiquement
   # Vérifier les logs : "Reload env: .env.local"
   ```

### Problème 4 : Signature webhook invalide

**Symptômes :**
```bash
Erreur de vérification du webhook: Invalid signature
```

**Solutions :**

1. **Vérifier le header de signature**
   ```typescript
   // Dans src/app/api/webhooks/stripe/route.ts
   const signature = (await headers()).get('stripe-signature')
   if (!signature) {
     // Erreur : header manquant
   }
   ```

2. **Valider le secret d'environnement**
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   # Doit commencer par whsec_
   ```

3. **Tester avec curl**
   ```bash
   curl -X POST http://localhost:3000/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -H "stripe-signature: test" \
     -d '{"test": "data"}'
   ```

### Problème 5 : Événements non traités

**Symptômes :**
```bash
Événement Stripe non géré: customer.updated
```

**Solution :** Ajouter le traitement de l'événement

```typescript
// Dans src/app/api/webhooks/stripe/route.ts
switch (event.type) {
  // ... autres cas
  
  case 'customer.updated': {
    const customer = event.data.object as Stripe.Customer
    console.log('Customer updated:', customer.id)
    // Traitement spécifique si nécessaire
    break
  }
  
  default:
    console.log('Événement Stripe non géré:', event.type)
}
```

## 💾 Problèmes de base de données

### Problème 6 : Erreurs Supabase RLS

**Symptômes :**
```bash
Erreur Supabase: { code: '42501', message: 'new row violates row-level security policy' }
```

**Solutions :**

1. **Vérifier les politiques RLS**
   ```sql
   -- Dans Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

2. **Utiliser supabaseAdmin pour les webhooks**
   ```typescript
   // Correct : utilise la clé service_role
   import { supabaseAdmin } from '@/lib/supabase'
   
   const { error } = await supabaseAdmin
     .from('users')
     .upsert({ ... })
   ```

3. **Vérifier les permissions de la clé service**
   ```bash
   # Dans .env.local
   SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Clé service_role, pas anon
   ```

### Problème 7 : Colonnes manquantes

**Symptômes :**
```bash
Erreur Supabase: column "subscription_status" does not exist
```

**Solution :** Vérifier le schéma de base de données

```sql
-- Exécuter dans Supabase SQL Editor
\d users;  -- Affiche la structure de la table

-- Ou recréer la table si nécessaire
DROP TABLE IF EXISTS users CASCADE;
-- Puis exécuter le contenu de supabase-schema.sql
```

## 🌐 Problèmes de réseau

### Problème 8 : Connection refused

**Symptômes :**
```bash
stripe listen: connection refused to localhost:3000
```

**Solutions :**

1. **Vérifier que l'app tourne**
   ```bash
   curl http://localhost:3000
   # Doit retourner la page d'accueil
   ```

2. **Vérifier le port**
   ```bash
   lsof -i :3000
   # Doit afficher le processus Next.js
   ```

3. **Redémarrer l'application**
   ```bash
   npm run dev
   ```

### Problème 9 : CORS errors

**Symptômes :**
```bash
Access to fetch at 'https://api.stripe.com' blocked by CORS policy
```

**Solution :** Utiliser les API routes Next.js

```typescript
// ❌ Incorrect : appel direct depuis le client
const session = await stripe.checkout.sessions.create(...)

// ✅ Correct : via API route
const response = await fetch('/api/create-checkout-session', {
  method: 'POST',
  body: JSON.stringify({ priceId })
})
```

## 🔧 Problèmes de développement

### Problème 10 : Variables d'environnement non chargées

**Symptômes :**
```bash
process.env.STRIPE_SECRET_KEY is undefined
```

**Solutions :**

1. **Vérifier le nom du fichier**
   ```bash
   ls -la | grep env
   # Doit afficher .env.local (pas .env)
   ```

2. **Vérifier la syntaxe**
   ```bash
   # ✅ Correct
   STRIPE_SECRET_KEY=sk_test_123...
   
   # ❌ Incorrect (espaces)
   STRIPE_SECRET_KEY = sk_test_123...
   ```

3. **Redémarrer le serveur de développement**
   ```bash
   # Ctrl+C puis
   npm run dev
   ```

### Problème 11 : TypeScript errors

**Symptômes :**
```bash
Property 'current_period_end' does not exist on type 'Subscription'
```

**Solution :** Cast correct des types Stripe

```typescript
// ✅ Correct
const subscription = event.data.object as Stripe.Subscription
const periodEnd = new Date(subscription.current_period_end * 1000)

// Ou avec assertion de type
const periodEnd = new Date((subscription as any).current_period_end * 1000)
```

## 📊 Outils de diagnostic

### Commandes de vérification rapide

```bash
# 1. Vérifier Stripe CLI
stripe --version

# 2. Vérifier la connexion Stripe
stripe config --list

# 3. Vérifier l'application
curl http://localhost:3000/api/webhooks/stripe

# 4. Vérifier les variables d'environnement
grep STRIPE .env.local

# 5. Tester un webhook simple
stripe trigger checkout.session.completed
```

### Logs de débogage

```typescript
// Ajouter dans src/app/api/webhooks/stripe/route.ts
console.log('Webhook reçu:', {
  type: event.type,
  id: event.id,
  created: new Date(event.created * 1000)
})
```

## ✅ Checklist de diagnostic

### Configuration de base
- [ ] **Stripe CLI** installé et connecté
- [ ] **Variables d'environnement** correctes
- [ ] **Price ID** valide
- [ ] **Application** en cours d'exécution

### Webhooks
- [ ] **Webhook secret** mis à jour
- [ ] **Signature** validée
- [ ] **Événements** traités
- [ ] **Statuts [200]** confirmés

### Base de données
- [ ] **Schéma** créé correctement
- [ ] **Permissions RLS** configurées
- [ ] **Clé service_role** utilisée
- [ ] **Données** synchronisées

### Tests
- [ ] **Tous les événements** testés
- [ ] **Aucune erreur** dans les logs
- [ ] **Synchronisation** validée
- [ ] **Interface utilisateur** fonctionnelle

## 🎯 État actuel TidiMondo

```bash
✅ Configuration complète validée
✅ Tous les webhooks fonctionnels [200]
✅ Base de données synchronisée
✅ Interface utilisateur opérationnelle
✅ Tests complets réussis
✅ Aucun problème identifié

Status : Production Ready 🚀
```

## 📚 Ressources supplémentaires

- **[Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)**
- **[Webhook Testing Guide](https://stripe.com/docs/webhooks/test)**
- **[API Reference](https://stripe.com/docs/api)**

---

**Note** : Cette documentation couvre tous les problèmes identifiés et résolus lors du développement de TidiMondo.