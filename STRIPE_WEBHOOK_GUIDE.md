# Guide complet : Comment obtenir le STRIPE_WEBHOOK_SECRET

## 🎯 Qu'est-ce que le Webhook Secret ?

Le `STRIPE_WEBHOOK_SECRET` est une clé secrète générée par Stripe pour sécuriser les webhooks. Elle permet de vérifier que les événements reçus proviennent bien de Stripe et non d'un attaquant.

## 📋 Étapes pour obtenir le Webhook Secret

### 1. Créer un compte Stripe (si pas déjà fait)
- Allez sur [stripe.com](https://stripe.com)
- Créez un compte ou connectez-vous
- Activez le mode "Test" (toggle en haut à droite)

### 2. Accéder à la section Webhooks
1. Dans le dashboard Stripe, cliquez sur **"Developers"** dans le menu de gauche
2. Cliquez sur **"Webhooks"**
3. Vous verrez une liste des webhooks (vide si c'est votre premier)

### 3. Créer un nouveau webhook
1. Cliquez sur **"Add endpoint"** ou **"+ Add endpoint"**
2. Dans **"Endpoint URL"**, entrez :
   - Pour le développement local : `https://votre-ngrok-url.ngrok.io/api/webhooks/stripe`
   - Pour la production : `https://votre-domaine.com/api/webhooks/stripe`

### 4. Sélectionner les événements
Cochez ces événements importants pour un SaaS :
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated` 
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `checkout.session.completed`

### 5. Créer l'endpoint
1. Cliquez sur **"Add endpoint"**
2. Stripe va créer votre webhook et vous rediriger vers sa page de détails

### 6. Récupérer le Webhook Secret
1. Sur la page de détails du webhook, vous verrez une section **"Signing secret"**
2. Cliquez sur **"Reveal"** ou **"Click to reveal"**
3. Copiez la valeur qui commence par `whsec_...`
4. C'est votre `STRIPE_WEBHOOK_SECRET` !

## 🔧 Configuration pour le développement local

### Option 1 : Utiliser ngrok (Recommandé)
```bash
# Installer ngrok
npm install -g ngrok

# Dans un terminal, lancer votre app Next.js
npm run dev

# Dans un autre terminal, exposer le port 3000
ngrok http 3000

# Utiliser l'URL HTTPS fournie par ngrok dans Stripe
# Exemple: https://abc123.ngrok.io/api/webhooks/stripe
```

### Option 2 : Utiliser Stripe CLI
```bash
# Installer Stripe CLI
# Sur macOS avec Homebrew:
brew install stripe/stripe-cli/stripe

# Se connecter à Stripe
stripe login

# Écouter les webhooks localement
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# La commande affichera votre webhook secret temporaire
```

## 📝 Exemple de configuration .env.local

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1ABC...

# Pour le développement local avec ngrok
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Pour la production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
```

## 🚨 Points importants

### Sécurité
- ⚠️ **Ne jamais** committer le webhook secret dans Git
- ⚠️ Utilisez des secrets différents pour test/production
- ⚠️ Régénérez le secret si vous pensez qu'il a été compromis

### Environnements
- **Test** : Utilisez les clés de test Stripe (commencent par `pk_test_` et `sk_test_`)
- **Production** : Utilisez les clés de production (commencent par `pk_live_` et `sk_live_`)

### URLs de webhook
- **Développement** : `https://votre-ngrok.ngrok.io/api/webhooks/stripe`
- **Production** : `https://votre-domaine.com/api/webhooks/stripe`

## 🔍 Vérification que ça fonctionne

### 1. Tester avec Stripe CLI
```bash
# Déclencher un événement de test
stripe trigger checkout.session.completed
```

### 2. Vérifier dans le dashboard Stripe
1. Allez dans **Developers > Webhooks**
2. Cliquez sur votre webhook
3. Consultez l'onglet **"Recent deliveries"**
4. Vous devriez voir les événements avec leur statut (succès/échec)

### 3. Logs dans votre application
Votre endpoint `/api/webhooks/stripe` devrait recevoir et traiter les événements.

## 🛠️ Dépannage

### Erreur "Webhook signature verification failed"
- Vérifiez que le `STRIPE_WEBHOOK_SECRET` est correct
- Assurez-vous d'utiliser le bon secret (test vs production)

### Webhook non reçu
- Vérifiez que l'URL est accessible publiquement
- Vérifiez que ngrok fonctionne correctement
- Consultez les logs Stripe pour voir les erreurs

### Événements manqués
- Vérifiez que vous avez sélectionné les bons événements
- Stripe garde un historique de 30 jours, vous pouvez rejouer les événements

## 📚 Ressources utiles

- [Documentation officielle Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Guide ngrok](https://ngrok.com/docs)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Événements Stripe](https://stripe.com/docs/api/events/types)

## 🎯 Résumé rapide

1. **Dashboard Stripe** → **Developers** → **Webhooks**
2. **Add endpoint** avec votre URL
3. **Sélectionner les événements** nécessaires
4. **Créer l'endpoint**
5. **Révéler le signing secret** → C'est votre `STRIPE_WEBHOOK_SECRET`
6. **Copier dans .env.local**

Le secret ressemble à : `whsec_1234567890abcdef...`