import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
        console.log('Checkout session completed:', session.id)

        // Récupérer l'abonnement
        if (session.subscription && session.customer) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          // Mettre à jour l'utilisateur dans Supabase
          const clerkUserId = session.metadata?.clerk_user_id
          if (clerkUserId) {
            const { error } = await supabaseAdmin
              .from('users')
              .upsert({
                clerk_user_id: clerkUserId,
                stripe_customer_id: session.customer as string,
                subscription_id: subscription.id,
                subscription_status: subscription.status,
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString()
              })

            if (error) {
              console.error('Erreur Supabase:', error)
            } else {
              console.log('Utilisateur mis à jour après checkout:', clerkUserId)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription updated:', subscription.id)

        // Mettre à jour le statut de l'abonnement
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: subscription.status,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)

        if (error) {
          console.error('Erreur Supabase:', error)
        } else {
          console.log('Statut d\'abonnement mis à jour:', subscription.id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('Subscription deleted:', subscription.id)

        // Désactiver l'abonnement
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_id: null,
            current_period_end: null,
            updated_at: new Date().toISOString()
          })
          .eq('subscription_id', subscription.id)

        if (error) {
          console.error('Erreur Supabase:', error)
        } else {
          console.log('Abonnement annulé:', subscription.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment succeeded:', invoice.id)

        if ((invoice as any).subscription) {
          // Réactiver l'abonnement si nécessaire
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', (invoice as any).subscription as string)

          if (error) {
            console.error('Erreur Supabase:', error)
          } else {
            console.log('Paiement réussi pour l\'abonnement:', (invoice as any).subscription)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed:', invoice.id)

        if ((invoice as any).subscription) {
          // Marquer l'abonnement comme en échec de paiement
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('subscription_id', (invoice as any).subscription as string)

          if (error) {
            console.error('Erreur Supabase:', error)
          } else {
            console.log('Échec de paiement pour l\'abonnement:', (invoice as any).subscription)
          }
        }
        break
      }

      default:
        console.log('Événement Stripe non géré:', event.type)
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