# 02 - Configuration du Price ID Stripe

## 🎯 Objectif

Ce guide explique comment créer et configurer un Price ID dans Stripe pour votre application SaaS TidiMondo.

## 🔍 Différence entre Payment Link et Price ID

### Payment Link
- **URL directe** : `https://buy.stripe.com/test_7sYfZhbDt0MT8f82nJ4ko00`
- **Usage** : Partage direct, emails, réseaux sociaux
- **Limitation** : Pas d'intégration programmatique

### Price ID
- **Identifiant** : `price_1ABC123def456ghi789`
- **Usage** : Intégration dans votre application
- **Avantage** : Contrôle total du flux de paiement

## 🛠️ Méthode 1 : Créer un nouveau produit avec Price ID

### Étapes dans le Dashboard Stripe

1. **Accéder aux produits**
   - Dashboard Stripe → **Products** → **Add product**

2. **Configurer le produit**
   ```
   Nom : TidiMondo Pro
   Description : Abonnement mensuel TidiMondo
   ```

3. **Configurer le prix**
   ```
   Prix : 29€
   Récurrence : Monthly
   Devise : EUR
   ```

4. **Créer et récupérer le Price ID**
   - Cliquer sur **Save product**
   - **Copier le Price ID** : `price_1ABC123...`

## 🔍 Méthode 2 : Récupérer le Price ID depuis un Payment Link existant

### Si vous avez déjà un Payment Link

1. **Dashboard Stripe** → **Payment links**
2. **Cliquer sur votre Payment Link**
3. **Section "Line items"** → Cliquer sur le produit
4. **Copier le Price ID** affiché

### Si pas de section "Line items"

1. **Dashboard Stripe** → **Products**
2. **Cliquer sur votre produit** "TidiMondo Pro"
3. **Section "Pricing"** → Copier le Price ID

## ⚙️ Configuration dans l'application

### Mise à jour du fichier .env.local

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1ABC123def456ghi789  # ← Votre Price ID
```

### Redémarrage de l'application

```bash
# L'application se recharge automatiquement
# Vérifiez les logs : "Reload env: .env.local"
```

## 🧪 Validation de la configuration

### Test 1 : Vérification de la variable

```bash
# Dans la console de votre navigateur (page /pricing)
console.log(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID)
# Doit afficher : price_1ABC123...
```

### Test 2 : Test du bouton d'abonnement

1. **Aller sur** `/pricing`
2. **Cliquer** "Commencer maintenant"
3. **Vérifier** la redirection vers Clerk (si non connecté)
4. **Ou** redirection vers Stripe Checkout (si connecté)

## 🔧 Dépannage

### Problème : Price ID vide ou undefined

```bash
# Vérifier le fichier .env.local
cat .env.local | grep PRICE_ID

# Doit afficher :
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1ABC123...
```

### Problème : Erreur "Price not found"

1. **Vérifier** que le Price ID existe dans Stripe
2. **Dashboard Stripe** → **Products** → Vérifier le produit
3. **Copier à nouveau** le Price ID correct

### Problème : Variable non rechargée

```bash
# Redémarrer manuellement l'application
npm run dev
```

## 📊 Validation avec Stripe CLI

### Test de création de session

```bash
# Terminal 1 : Application
npm run dev

# Terminal 2 : Test API
curl -X POST http://localhost:3000/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"priceId": "price_1ABC123..."}'
```

### Réponse attendue

```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

## ✅ Checklist de validation

- [ ] **Price ID créé** dans Stripe Dashboard
- [ ] **Variable configurée** dans .env.local
- [ ] **Application redémarrée** automatiquement
- [ ] **Page /pricing** accessible
- [ ] **Bouton d'abonnement** fonctionnel
- [ ] **Redirection Stripe** opérationnelle

## 🎯 Configuration actuelle TidiMondo

```bash
# Configuration validée
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1RksjsI2mBbckBzP...  # ✅ Configuré
Prix : 29€/mois  # ✅ Validé
Devise : EUR     # ✅ Confirmé
Type : Abonnement mensuel  # ✅ Opérationnel
```

## 📚 Guides suivants

- **[03-STRIPE_CLI_SETUP.md](./03-STRIPE_CLI_SETUP.md)** - Installation de Stripe CLI
- **[04-STRIPE_WEBHOOK_TESTING.md](./04-STRIPE_WEBHOOK_TESTING.md)** - Tests des webhooks

---

**Note** : Le Price ID est maintenant correctement configuré dans TidiMondo et entièrement fonctionnel.