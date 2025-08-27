# 06 - Guide des Codes Promo Stripe - Version Native

## 🎯 Objectif

Ce guide explique l'implémentation des codes promo avec l'approche native Stripe pour TidiMondo.

## ✅ Implémentation Réalisée

### 1. Configuration de la Session de Checkout

Le fichier [`src/app/api/create-checkout-session/route.ts`](../src/app/api/create-checkout-session/route.ts) a été modifié avec :

```typescript
const session = await stripe.checkout.sessions.create({
  customer: customer.id,
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${appUrl}/dashboard?success=true`,
  cancel_url: `${appUrl}/pricing?canceled=true`,
  allow_promotion_codes: true, // 🎯 Active les codes promo sur l'interface Stripe
  metadata: { clerk_user_id: userId },
  subscription_data: { metadata: { clerk_user_id: userId } }
})
```

### 2. Interface Utilisateur Simplifiée

La page [`src/app/pricing/page.tsx`](../src/app/pricing/page.tsx) inclut :

- **Information claire** : Les utilisateurs sont informés qu'ils peuvent saisir un code promo lors du paiement
- **Interface simple** : Pas de validation côté client, tout est géré par Stripe
- **Expérience fluide** : Redirection directe vers l'interface de paiement Stripe

## 🛠️ Création des Coupons de Test

### Dans le Dashboard Stripe (Mode Test)

1. **Allez dans** : Produits → Coupons
2. **Créez ces coupons de test** :

#### Coupon 1 : Réduction Pourcentage
```
ID: LAUNCH20
Type: Pourcentage
Valeur: 20%
Durée: Une fois
Description: Lancement - 20% de réduction
```

#### Coupon 2 : Réduction Étudiante
```
ID: STUDENT15
Type: Pourcentage
Valeur: 15%
Durée: Une fois
Description: Réduction étudiante
```

#### Coupon 3 : Montant Fixe
```
ID: WELCOME5
Type: Montant fixe
Valeur: 5€
Durée: Une fois
Description: Bienvenue - 5€ de réduction
```

#### Coupon 4 : Récurrent
```
ID: EARLY10
Type: Pourcentage
Valeur: 10%
Durée: 3 mois
Description: Early adopter - 10% pendant 3 mois
```

## 🧪 Tests à Effectuer

### 1. Test Sans Code Promo

1. Accédez à `/pricing`
2. Cliquez sur "Commencer mon essai Pro"
3. **Vérifiez** : Prix affiché = 9,99€
4. **Vérifiez** : Champ "Code promo" disponible sur l'interface Stripe
5. Complétez ou annulez le paiement

### 2. Test Avec Code Promo Valide

1. Accédez à `/pricing`
2. Cliquez sur "Commencer mon essai Pro"
3. **Saisissez** : `LAUNCH20` dans le champ code promo
4. **Vérifiez** : Prix réduit automatiquement à 7,99€ (20% de réduction)
5. **Vérifiez** : Message de confirmation de Stripe
6. Complétez ou annulez le paiement

### 3. Test Avec Code Promo Invalide

1. Accédez à `/pricing`
2. Cliquez sur "Commencer mon essai Pro"
3. **Saisissez** : `INVALID` dans le champ code promo
4. **Vérifiez** : Message d'erreur de Stripe
5. **Vérifiez** : Prix reste à 9,99€

### 4. Test Codes Multiples

Testez chaque coupon créé :
- `LAUNCH20` → -20%
- `STUDENT15` → -15%
- `WELCOME5` → -5€
- `EARLY10` → -10% (récurrent)

## 📊 Avantages de cette Approche

### ✅ Avantages

1. **Simplicité** : Aucune logique côté client à maintenir
2. **Sécurité** : Validation entièrement gérée par Stripe
3. **Interface optimisée** : UX/UI native de Stripe, testée et fiable
4. **Gestion centralisée** : Tous les coupons dans le dashboard Stripe
5. **Reporting intégré** : Analytics d'utilisation des coupons
6. **Flexibilité** : Création/modification des coupons sans déployer de code

### ⚠️ Limitations

1. **Coupons Stripe uniquement** : Pas de logique métier personnalisée
2. **Interface fixe** : Pas de personnalisation du champ code promo
3. **Validation différée** : La validation se fait au moment du paiement

## 🎯 Workflow Utilisateur Final

```mermaid
graph TD
    A[Page Pricing] --> B[Clic sur "Commencer Pro"]
    B --> C[Redirection vers Stripe Checkout]
    C --> D[Interface Stripe avec champ code promo]
    D --> E{Code promo saisi ?}
    E -->|Oui| F[Validation Stripe en temps réel]
    E -->|Non| G[Prix normal affiché]
    F --> H{Code valide ?}
    H -->|Oui| I[Prix réduit affiché]
    H -->|Non| J[Message d'erreur Stripe]
    I --> K[Paiement avec réduction]
    G --> L[Paiement prix normal]
    J --> D
    K --> M[Succès - Retour /dashboard]
    L --> M
```

## 🚀 Mise en Production

### Variables d'Environnement Requises

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_live_...
```

### Checklist Pré-Production

- [ ] Créer les coupons en mode Live
- [ ] Tester avec des cartes de test Stripe
- [ ] Vérifier les webhooks en production
- [ ] Valider les métadonnées dans les abonnements
- [ ] Tester les redirections success/cancel

## 🎉 Conclusion

L'implémentation des codes promo avec l'approche native Stripe est **simple, robuste et maintenable**. Elle offre une excellente expérience utilisateur tout en minimisant la complexité technique côté application.

Cette solution respecte les meilleures pratiques et s'intègre parfaitement avec l'écosystème Stripe existant de TidiMondo.