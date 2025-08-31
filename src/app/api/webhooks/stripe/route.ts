import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { headers } from 'next/headers'
import Stripe from 'stripe'

interface InvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription
}

export async function POST(request: NextRequest) {
  console.log('🎯 WEBHOOK STRIPE - Début du traitement')
  
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  console.log('📝 Webhook reçu:', {
    hasSignature: !!signature,
    bodyLength: body.length,
    timestamp: new Date().toISOString()
  })

  if (!signature) {
    console.log('❌ Signature Stripe manquante')
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
    console.log('✅ Webhook vérifié avec succès:', event.type)
  } catch (error) {
    console.error('❌ Erreur de vérification du webhook:', error)
    return NextResponse.json(
      { error: 'Signature webhook invalide' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('🎉 CHECKOUT SESSION COMPLETED:', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata,
          paymentStatus: session.payment_status
        })

        // Récupérer l'abonnement
        if (session.subscription && session.customer) {
          console.log('📋 Récupération de l\'abonnement Stripe...')
          
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          console.log('💳 Abonnement Stripe récupéré:', {
            id: subscription.id,
            status: subscription.status,
            customerId: subscription.customer
          })

          // Mettre à jour l'utilisateur dans Supabase
          const clerkUserId = session.metadata?.clerk_user_id
          console.log('🔍 Clerk User ID depuis metadata:', clerkUserId)
          
          if (clerkUserId) {
            console.log('📝 Mise à jour Supabase en cours...')
            
            const { data, error } = await supabaseAdmin
              .from('users')
              .update({
                stripe_customer_id: session.customer as string,
                subscription_status: subscription.status,
                updated_at: new Date().toISOString()
              })
              .eq('clerk_user_id', clerkUserId)
              .select()

            if (error) {
              console.error('❌ ERREUR SUPABASE:', {
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              })
            } else {
              console.log('✅ UTILISATEUR MIS À JOUR:', {
                clerkUserId,
                data,
                subscriptionStatus: subscription.status
              })
            }
          } else {
            console.error('❌ CLERK_USER_ID MANQUANT dans les metadata')
          }
        } else {
          console.error('❌ SUBSCRIPTION OU CUSTOMER MANQUANT:', {
            hasSubscription: !!session.subscription,
            hasCustomer: !!session.customer
          })
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
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', subscription.customer as string)

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
            stripe_customer_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', subscription.customer as string)

        if (error) {
          console.error('Erreur Supabase:', error)
        } else {
          console.log('Abonnement annulé:', subscription.id)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('💰 INVOICE.PAYMENT_SUCCEEDED - Début du traitement:', {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId: (invoice as InvoiceWithSubscription).subscription,
          amount: invoice.amount_paid,
          hasSubscription: !!(invoice as InvoiceWithSubscription).subscription,
          billingReason: invoice.billing_reason,
          status: invoice.status
        })

        // Cas 1: Invoice avec subscription (renouvellement d'abonnement)
        if ((invoice as InvoiceWithSubscription).subscription) {
          console.log('🔄 Traitement du renouvellement d\'abonnement...')
          
          const { data, error } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_customer_id', invoice.customer as string)
            .select()

          if (error) {
            console.error('❌ Erreur Supabase pour renouvellement:', {
              error: error.message,
              details: error.details,
              code: error.code
            })
          } else {
            console.log('✅ Abonnement renouvelé avec succès:', {
              subscriptionId: (invoice as InvoiceWithSubscription).subscription,
              userData: data
            })
          }
        }
        // Cas 2: Invoice sans subscription (paiement initial ou one-time)
        else {
          console.log('⚠️ Invoice sans subscription - Recherche du customer dans Supabase...')
          
          // Vérifier si le customer existe dans notre base
          const { data: userData, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('stripe_customer_id', invoice.customer as string)
            .single()

          if (fetchError) {
            console.error('❌ Erreur lors de la recherche du customer:', {
              error: fetchError.message,
              customerId: invoice.customer
            })
          } else if (userData) {
            console.log('📋 Customer trouvé dans Supabase:', {
              clerkUserId: userData.clerk_user_id,
              email: userData.email,
              currentStatus: userData.subscription_status,
              stripeCustomerId: userData.stripe_customer_id
            })
            
            // Si l'utilisateur n'est pas encore actif, l'activer
            if (userData.subscription_status !== 'active') {
              console.log('🔧 Activation du compte premium...')
              
              const { data: updateData, error: updateError } = await supabaseAdmin
                .from('users')
                .update({
                  subscription_status: 'active',
                  updated_at: new Date().toISOString()
                })
                .eq('stripe_customer_id', invoice.customer as string)
                .select()

              if (updateError) {
                console.error('❌ Erreur lors de l\'activation:', {
                  error: updateError.message,
                  details: updateError.details,
                  code: updateError.code
                })
              } else {
                console.log('✅ COMPTE PREMIUM ACTIVÉ AVEC SUCCÈS:', {
                  clerkUserId: userData.clerk_user_id,
                  invoiceId: invoice.id,
                  updateData
                })
              }
            } else {
              console.log('ℹ️ Utilisateur déjà actif - Aucune action nécessaire')
            }
          } else {
            console.error('⚠️ AUCUN UTILISATEUR TROUVÉ avec ce customer_id:', {
              customerId: invoice.customer,
              invoiceId: invoice.id
            })
            
            // Essayer de trouver par une autre méthode si possible
            console.log('🔍 Tentative de récupération via Stripe customer...')
            try {
              const customer = await stripe.customers.retrieve(invoice.customer as string)
              console.log('📊 Données customer Stripe:', {
                customerId: customer.id,
                email: 'email' in customer ? customer.email : 'N/A',
                metadata: 'metadata' in customer ? customer.metadata : {}
              })
            } catch (stripeError) {
              console.error('❌ Erreur lors de la récupération du customer Stripe:', stripeError)
            }
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Payment failed:', invoice.id)

        if ((invoice as InvoiceWithSubscription).subscription) {
          // Marquer l'abonnement comme en échec de paiement
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('stripe_customer_id', invoice.customer as string)

          if (error) {
            console.error('Erreur Supabase:', error)
          } else {
            console.log('Échec de paiement pour l\'abonnement:', (invoice as InvoiceWithSubscription).subscription)
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