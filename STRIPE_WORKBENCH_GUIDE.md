# Guide Stripe Workbench - Configuration des Webhooks

## 🎯 Interface Stripe Workbench (Nouvelle version)

Vous êtes dans la nouvelle interface Stripe Workbench, qui est plus moderne et intuitive. Voici comment configurer vos webhooks :

## 📋 Étapes avec l'interface Workbench

### 1. Ajouter une destination (Add destination)

Sur la page que vous voyez, cliquez sur le bouton **"+ Add destination"** (bouton violet).

### 2. Configurer l'endpoint

Une fois que vous cliquez sur "Add destination", vous verrez un formulaire avec :

**Endpoint URL** :
- Pour le développement local : `https://votre-ngrok-url.ngrok.io/api/webhooks/stripe`
- Pour la production : `https://votre-domaine.com/api/webhooks/stripe`

**Description** (optionnel) :
- Exemple : "TidiMondo SaaS Webhooks"

### 3. Sélectionner les événements

Dans la section "Events to send", sélectionnez ces événements essentiels pour un SaaS :

#### 🔥 Événements critiques :
- ✅ `checkout.session.completed` - Quand un paiement est finalisé
- ✅ `customer.subscription.created` - Nouvel abonnement
- ✅ `customer.subscription.updated` - Modification d'abonnement
- ✅ `customer.subscription.deleted` - Annulation d'abonnement
- ✅ `invoice.payment_succeeded` - Paiement réussi
- ✅ `invoice.payment_failed` - Paiement échoué

#### 📊 Événements utiles (optionnels) :
- `customer.created` - Nouveau client
- `customer.updated` - Modification client
- `payment_intent.succeeded` - Paiement unique réussi

### 4. Créer l'endpoint

Cliquez sur **"Add destination"** ou **"Create"** pour finaliser.

### 5. Récupérer le Webhook Secret

Après création, vous serez redirigé vers la page de détails de votre webhook. Vous y trouverez :

1. **Section "Signing secret"** ou **"Endpoint details"**
2. Cliquez sur **"Reveal"** ou l'icône œil 👁️
3. Copiez la valeur qui commence par `whsec_...`

## 🧪 Option : Test avec un listener local

Si vous préférez tester localement d'abord, vous pouvez utiliser l'option **"Test with a local listener"** :

### Avec Stripe CLI :
```bash
# Installer Stripe CLI (si pas déjà fait)
brew install stripe/stripe-cli/stripe  # macOS
# ou télécharger depuis https://stripe.com/docs/stripe-cli

# Se connecter
stripe login

# Écouter les webhooks localement
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Cette commande affichera votre webhook secret temporaire
# Exemple: whsec_1234567890abcdef...
```

### Avec ngrok :
```bash
# Terminal 1 : Lancer votre app
npm run dev

# Terminal 2 : Exposer le port avec ngrok
npx ngrok http 3000

# Utiliser l'URL HTTPS dans Stripe
# Exemple: https://abc123.ngrok.io/api/webhooks/stripe
```

## 📝 Configuration finale dans .env.local

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51ABC...
STRIPE_SECRET_KEY=sk_test_51ABC...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...  # ← Votre secret récupéré
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1ABC...

# URL de votre application
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io  # ou votre domaine
```

## 🔍 Vérification dans Workbench

Une fois configuré, vous pourrez :

1. **Voir les événements** dans l'onglet "Events"
2. **Tester les webhooks** avec des événements simulés
3. **Consulter les logs** pour déboguer
4. **Voir les erreurs** si quelque chose ne fonctionne pas

## 🎯 Résumé rapide pour votre cas

1. **Cliquez sur "+ Add destination"** (bouton violet)
2. **URL** : `https://votre-ngrok.ngrok.io/api/webhooks/stripe`
3. **Événements** : Sélectionnez au minimum `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`
4. **Créer** l'endpoint
5. **Révéler et copier** le signing secret
6. **Ajouter** le secret dans votre `.env.local`

## 🚀 Prochaine étape

Une fois le webhook configuré, vous pourrez :
- Tester l'interface de votre SaaS
- Implémenter la logique de traitement des webhooks
- Tester les paiements de bout en bout

Voulez-vous que je vous aide à configurer ngrok ou préférez-vous d'abord tester l'interface sans les webhooks ?