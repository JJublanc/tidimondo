# 03 - Installation et Configuration de Stripe CLI

## 🎯 Objectif

Ce guide couvre l'installation et la configuration de Stripe CLI pour tester les webhooks en développement.

## 🚀 Pourquoi Stripe CLI ?

### Avantages par rapport à ngrok

| Aspect | Stripe CLI | ngrok |
|--------|------------|-------|
| **Installation** | 1 commande | 1 commande |
| **Configuration** | Automatique | Manuelle |
| **URL** | Pas besoin | Doit copier/coller |
| **Logs** | Intégrés détaillés | Basiques |
| **Tests** | Simulation intégrée | Paiements réels |
| **Sécurité** | Maximum | Bonne |
| **Maintenance** | Zéro | URL change |

### Workflow simplifié

```bash
# Stripe CLI (1 commande)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# vs ngrok (3 étapes)
# 1. ngrok http 3000
# 2. Copier l'URL
# 3. Configurer dans Stripe Dashboard
```

## 📦 Installation

### macOS (Homebrew)

```bash
brew install stripe/stripe-cli/stripe
```

### Linux

```bash
# Ubuntu/Debian
wget -qO- https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

### Windows

```bash
# Chocolatey
choco install stripe-cli

# Ou télécharger depuis : https://stripe.com/docs/stripe-cli
```

### Vérification de l'installation

```bash
stripe --version
# Doit afficher : stripe version 1.28.0 (ou plus récent)
```

## 🔑 Authentification

### Connexion à votre compte Stripe

```bash
stripe login
```

**Processus automatique :**
1. Affiche un code de jumelage : `prize-gifted-warmer-likes`
2. Ouvre automatiquement votre navigateur
3. Vous connecte à votre compte Stripe
4. Autorise l'accès pour Stripe CLI

### Vérification de la connexion

```bash
stripe config --list
# Doit afficher votre configuration active
```

**Sortie attendue :**
```
[default]
device_name = your-computer-name
live_mode_api_key = 
live_mode_publishable_key = 
test_mode_api_key = sk_test_...
test_mode_publishable_key = pk_test_...
```

## 🎧 Configuration des webhooks

### Workflow de développement recommandé

```bash
# Terminal 1 : Application Next.js
npm run dev

# Terminal 2 : Webhooks Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Sortie de stripe listen

```bash
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
> 2025-07-20 21:06:35   --> product.created [evt_1ABC123]
> 2025-07-20 21:06:35  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_1ABC123]
```

**Important :** Copiez le `webhook signing secret` affiché !

## ⚙️ Configuration de l'application

### Mise à jour du .env.local

```bash
# Remplacer le webhook secret par celui généré par Stripe CLI
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Redémarrage automatique

L'application Next.js se recharge automatiquement :
```
Reload env: .env.local
```

## 🧪 Tests d'événements

### Événements principaux pour TidiMondo

```bash
# Terminal 3 : Tests d'événements
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

### Logs en temps réel

Stripe CLI affiche automatiquement :
```bash
2025-07-20 21:09:14   --> checkout.session.completed [evt_1ABC123]
2025-07-20 21:09:14  <--  [200] POST http://localhost:3000/api/webhooks/stripe [evt_1ABC123]
```

**Statuts :**
- ✅ `[200]` : Webhook traité avec succès
- ❌ `[400]` : Erreur de signature ou de format
- ❌ `[500]` : Erreur serveur

## 🔧 Commandes utiles

### Lister tous les événements disponibles

```bash
stripe trigger --help
```

### Logs détaillés

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe --log-level debug
```

### Filtrer par événements spécifiques

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe \
  --events checkout.session.completed,customer.subscription.created
```

### Historique des événements

```bash
# Voir les derniers événements de votre compte
stripe events list --limit 10

# Détails d'un événement spécifique
stripe events retrieve evt_1ABC123
```

### Rejouer un événement

```bash
stripe events resend evt_1ABC123
```

## 🚨 Dépannage

### Problème : "Command not found"

```bash
# Vérifier l'installation
which stripe

# Réinstaller si nécessaire (macOS)
brew reinstall stripe/stripe-cli/stripe
```

### Problème : "Not authenticated"

```bash
# Se reconnecter
stripe login

# Vérifier la configuration
stripe config --list
```

### Problème : "Webhook signature verification failed"

```bash
# Vérifier le secret dans .env.local
echo $STRIPE_WEBHOOK_SECRET

# Redémarrer l'app après modification
npm run dev
```

### Problème : "Connection refused"

```bash
# Vérifier que l'app tourne
curl http://localhost:3000/api/webhooks/stripe

# Vérifier le port
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## ✅ Checklist de validation

- [ ] **Stripe CLI installé** et fonctionnel
- [ ] **Connexion à Stripe** réussie
- [ ] **Webhook secret** copié dans .env.local
- [ ] **App Next.js** démarrée (Terminal 1)
- [ ] **Stripe CLI** en écoute (Terminal 2)
- [ ] **Test d'événement** réussi (Terminal 3)
- [ ] **Logs [200]** visibles dans les deux terminaux
- [ ] **Données** mises à jour dans Supabase

## 🎯 Configuration actuelle TidiMondo

```bash
# Installation validée
✅ Stripe CLI version 1.28.0
✅ Connexion au compte Stripe réussie
✅ Webhook secret configuré : whsec_...
✅ Tous les événements testés avec succès
✅ Statuts [200] confirmés pour tous les webhooks
```

## 📚 Guides suivants

- **[04-STRIPE_WEBHOOK_TESTING.md](./04-STRIPE_WEBHOOK_TESTING.md)** - Tests complets des webhooks
- **[05-STRIPE_TROUBLESHOOTING.md](./05-STRIPE_TROUBLESHOOTING.md)** - Résolution des problèmes

---

**Note** : Stripe CLI est maintenant entièrement configuré et opérationnel pour TidiMondo.