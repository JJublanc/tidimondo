# 🧪 Guide de Test - TidiMondo SaaS

## 🎯 Objectif
Tester l'intégration complète : Clerk + Supabase + Stripe pour valider le flux d'abonnement.

## 📋 Prérequis

### 1. Configurer Supabase
1. **Créer un projet Supabase** sur [supabase.com](https://supabase.com)
2. **Exécuter le schéma SQL** :
   - Aller dans "SQL Editor" 
   - Copier le contenu de `supabase-schema.sql`
   - Exécuter le script
3. **Récupérer les clés** :
   - Project URL : `https://xxx.supabase.co`
   - Anon key : `eyJ...` (clé publique)
   - Service role key : `eyJ...` (clé privée)
4. **Mettre à jour .env.local** :
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

### 2. Configurer Stripe
1. **Créer un produit** dans le dashboard Stripe :
   - Nom : "TidiMondo Pro"
   - Prix : 29€/mois
   - Récurrent : Mensuel
2. **Copier le Price ID** : `price_1ABC...`
3. **Mettre à jour .env.local** :
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_ID=price_1ABC...
   ```

### 3. Configurer les webhooks (optionnel pour les tests)
Pour les tests complets, vous pouvez utiliser ngrok :
```bash
# Terminal 1 : App
npm run dev

# Terminal 2 : Tunnel ngrok
npx ngrok http 3000

# Utiliser l'URL HTTPS dans Stripe webhook
```

## 🚀 Tests à effectuer

### Test 1 : Page d'accueil
```
✅ Visiter http://localhost:3000
✅ Vérifier le design responsive
✅ Cliquer sur "Se connecter" → Redirection /sign-in
✅ Cliquer sur "Commencer" → Redirection /sign-up
```

### Test 2 : Authentification Clerk
```
✅ S'inscrire avec un nouvel email
✅ Vérifier la redirection vers /dashboard
✅ Se déconnecter et se reconnecter
✅ Vérifier la persistance de session
```

### Test 3 : Dashboard sans abonnement
```
✅ Accéder au dashboard après connexion
✅ Vérifier l'affichage "Gratuit" dans les stats
✅ Vérifier la bannière "Passer au Pro"
✅ Vérifier que les fonctionnalités premium sont bloquées
✅ Cliquer sur "Passer au Pro" → Redirection /pricing
```

### Test 4 : Page de tarification
```
✅ Vérifier l'affichage des deux plans
✅ Cliquer sur "S'abonner maintenant"
✅ Vérifier la redirection vers Stripe Checkout
```

### Test 5 : Paiement Stripe (Mode Test)
```
✅ Utiliser la carte de test : 4242 4242 4242 4242
✅ Date d'expiration : 12/34
✅ CVC : 123
✅ Finaliser le paiement
✅ Vérifier la redirection vers /dashboard?success=true
```

### Test 6 : Dashboard avec abonnement (Simulation)
Pour tester sans paiement réel, insérer manuellement dans Supabase :
```sql
-- Dans l'éditeur SQL Supabase
INSERT INTO users (
  clerk_user_id, 
  email, 
  subscription_status, 
  current_period_end
) VALUES (
  'votre_clerk_user_id',  -- Récupérer depuis Clerk dashboard
  'votre@email.com',
  'active',
  '2025-02-19 00:00:00+00'  -- Date future
);
```

Puis vérifier :
```
✅ Badge "Pro" dans le header
✅ Stats premium visibles
✅ Fonctionnalités premium débloquées
✅ Pas de bannière d'upgrade
```

## 🔧 Débogage

### Problèmes courants

#### 1. Erreur Clerk "Publishable key not valid"
```bash
# Vérifier dans .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

#### 2. Erreur Supabase "Invalid API key"
```bash
# Vérifier les URLs et clés
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

#### 3. Erreur Stripe "No such price"
```bash
# Vérifier le Price ID
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1ABC...
```

#### 4. Hook useSubscription ne fonctionne pas
- Vérifier que la table `users` existe dans Supabase
- Vérifier que l'utilisateur est bien inséré après inscription
- Vérifier les logs de la console pour les erreurs

### Logs utiles
```javascript
// Dans useSubscription.ts, ajouter des logs
console.log('User ID:', user?.id)
console.log('Subscription data:', data)
console.log('Supabase error:', error)
```

## 📊 Validation finale

### Checklist complète
- [ ] Page d'accueil s'affiche correctement
- [ ] Inscription/connexion Clerk fonctionne
- [ ] Dashboard s'affiche avec statut "Gratuit"
- [ ] Fonctionnalités premium sont bloquées
- [ ] Page pricing s'affiche correctement
- [ ] Redirection vers Stripe Checkout fonctionne
- [ ] (Optionnel) Paiement test réussi
- [ ] (Optionnel) Dashboard Pro s'affiche après paiement

### Performance
- [ ] Pages se chargent rapidement (< 2s)
- [ ] Pas d'erreurs dans la console
- [ ] Design responsive sur mobile/desktop

### Sécurité
- [ ] Routes protégées inaccessibles sans connexion
- [ ] Fonctionnalités premium bloquées sans abonnement
- [ ] Pas de clés secrètes exposées côté client

## 🚀 Déploiement

Une fois les tests validés localement :

1. **Déployer sur Vercel** :
   ```bash
   npm run build
   # Connecter le repo GitHub à Vercel
   ```

2. **Configurer les variables d'environnement** dans Vercel

3. **Mettre à jour les URLs** dans Clerk et Stripe :
   - Clerk : URLs de redirection
   - Stripe : URL des webhooks

4. **Tester en production** avec les mêmes étapes

## 🎯 Prochaines fonctionnalités

Après validation de la base :
- [ ] Gestion des échecs de paiement
- [ ] Annulation d'abonnement
- [ ] Facturation et historique
- [ ] Fonctionnalités métier spécifiques
- [ ] Analytics et reporting
- [ ] Support client intégré

Cette base solide vous permet de développer n'importe quel type de SaaS ! 🚀