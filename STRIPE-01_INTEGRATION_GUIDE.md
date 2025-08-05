# 01 - Guide d'Intégration Stripe

## 🎯 Objectif

Ce guide couvre l'intégration complète de Stripe dans l'application SaaS TidiMondo, incluant la configuration, les paiements, et les webhooks.

## 📋 Prérequis

- Compte Stripe (mode test)
- Application Next.js 14 configurée
- Variables d'environnement de base

## 🔧 1. Installation des dépendances

```bash
npm install stripe @stripe/stripe-js
```

## 🔑 2. Configuration des variables d'environnement

Ajoutez dans votre fichier `.env.local` :

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Sera configuré plus tard
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...  # Voir guide 02
```

## 📁 3. Structure des fichiers Stripe

```
src/
├── lib/
│   └── stripe.ts              # Configuration Stripe
├── app/
│   ├── pricing/
│   │   └── page.tsx           # Page de tarification
│   └── api/
│       ├── create-checkout-session/
│       │   └── route.ts       # API Stripe Checkout
│       └── webhooks/
│           └── stripe/
│               └── route.ts   # Webhooks Stripe
```

## 🛠️ 4. Configuration Stripe (src/lib/stripe.ts)

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})
```

## 💳 5. Page de tarification (src/app/pricing/page.tsx)

```typescript
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function PricingPage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = '/sign-in'
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          userId: user.id,
        }),
      })

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Tarification simple</h1>
        <p className="text-xl text-gray-600">Un seul plan, toutes les fonctionnalités</p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 border">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Plan Pro</h3>
            <div className="text-4xl font-bold mb-2">
              29€<span className="text-lg font-normal text-gray-600">/mois</span>
            </div>
            <p className="text-gray-600">Tout inclus pour votre SaaS</p>
          </div>

          <ul className="space-y-4 mb-8">
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Utilisateurs illimités
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Authentification sécurisée
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Paiements Stripe
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Support prioritaire
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              API complète
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Analytics avancées
            </li>
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'Commencer maintenant'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

## 🔄 6. API Checkout Session (src/app/api/create-checkout-session/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { priceId } = await request.json()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        clerk_user_id: userId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erreur Stripe:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session' },
      { status: 500 }
    )
  }
}
```

## 🔗 7. Webhooks Stripe (src/app/api/webhooks/stripe/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Signature Stripe manquante' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Erreur de vérification du webhook:', error)
    return NextResponse.json(
      { error: 'Signature webhook invalide' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const clerkUserId = session.metadata?.clerk_user_id
          if (clerkUserId) {
            await supabaseAdmin
              .from('users')
              .upsert({
                clerk_user_id: clerkUserId,
                stripe_customer_id: session.customer as string,
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', invoice.subscription as string)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', invoice.subscription as string)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }
}
```

## ✅ Validation de l'intégration

Une fois l'intégration terminée :

1. **Page de tarification** accessible sur `/pricing`
2. **Redirection Stripe Checkout** fonctionnelle
3. **Webhooks** configurés et testés
4. **Base de données** synchronisée avec Stripe

## 📚 Guides suivants

- **[02-STRIPE_PRICE_ID_SETUP.md](./02-STRIPE_PRICE_ID_SETUP.md)** - Configuration du Price ID
- **[03-STRIPE_CLI_SETUP.md](./03-STRIPE_CLI_SETUP.md)** - Installation de Stripe CLI
- **[04-STRIPE_WEBHOOK_TESTING.md](./04-STRIPE_WEBHOOK_TESTING.md)** - Tests des webhooks

---

**Note** : Cette intégration est entièrement fonctionnelle et testée dans l'application TidiMondo.